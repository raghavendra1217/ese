// backend/api/controllers/adminController.js

const db = require('../config/database');
// const { execFile } = require('child_process');
const path = require('path');

const { runPy } = require('../utils/emailRunner');
const { autoSendTransactionToAPI } = require('./integrationController');
const { formatTimestampsForDisplay, formatDatesForDisplay } = require('../utils/timeUtils');

/**
 * Helper function to calculate stock status based on available stock
 * @param {number} availableStock - The available stock quantity
 * @returns {string} - The calculated stock status
 */
const calculateStockStatus = (availableStock) => {
    const stock = parseInt(availableStock, 10);
    
    if (stock === 0) {
        return 'out_of_stock';
    } else if (stock <= 80) {
        return 'low';
    } else {
        return 'available';
    }
};

// const { spawn } = require('child_process');

// const sendAdminNotificationEmail = (subject, message) => {
//   return new Promise((resolve, reject) => {
//     const scriptPath = path.join(__dirname, '../utils/sendAdminNotificationEmail.py');
//     const python = spawn('python3', [scriptPath, subject, message]);

//     python.stdout.on('data', (data) => console.log(`📧 ${data}`));
//     python.stderr.on('data', (data) => console.error(`❌ ${data}`));

//     python.on('close', (code) => {
//       code === 0 ? resolve() : reject(new Error(`Exited with code ${code}`));
//     });
//   });
// };

// backend/api/controllers/adminController.js

const getVendorFullProfile = async (req, res) => {
    const { vendorId } = req.params;
    if (!vendorId) return res.status(400).json({ message: 'Vendor ID is required.' });

    const client = await db.connect();
    try {
        // --- Step 1: Vendor Details ---
        const vendorQuery = `
            SELECT v.*, l.status, l.role
            FROM vendors v
            JOIN login l ON v.id = l.user_id
            WHERE v.id = $1
        `;
        const vendorRes = await client.query(vendorQuery, [vendorId]);
        if (vendorRes.rows.length === 0) {
            return res.status(404).json({ message: 'Vendor not found.' });
        }
        const vendor = vendorRes.rows[0];

        // --- Step 2: Wallet Info ---
        const walletQuery = `SELECT * FROM wallet WHERE id = $1`;
        const walletRes = await client.query(walletQuery, [vendorId]);
        const wallet = walletRes.rows[0] || { digital_money: 0, percentage: null, last_updated_on: null };

        // --- Step 3: Transactions (deposit, withdrawal, referral_bonus) ---
        const txQuery = `
            SELECT * FROM transaction
            WHERE user_id = $1
            ORDER BY created_at DESC
        `;
        const txRes = await client.query(txQuery, [vendorId]);
        const transactions = txRes.rows;

        // --- Step 4: Trades / Purchases ---
        const tradeQuery = `
            SELECT t.*, p.paper_type 
            FROM trading t
            JOIN product p ON t.product_id = p.product_id
            WHERE t.vendor_id = $1
            ORDER BY t.date DESC
        `;
        const tradeRes = await client.query(tradeQuery, [vendorId]);
        const trades = tradeRes.rows;

        // --- Step 5: Referral Tree ---
        const referralTree = [];
        if (vendor.referral_id_list && vendor.referral_id_list.length > 0) {
            const referredQuery = `
                SELECT v.id, v.vendor_name, v.email, l.is_approved,
                       COALESCE(SUM(t.total_amount_paid) FILTER (WHERE t.is_approved = 'approved'), 0) AS total_spent
                FROM unnest($1::varchar[]) AS ref_id
                JOIN vendors v ON v.id = ref_id
                JOIN login l ON l.user_id = v.id
                LEFT JOIN trading t ON t.vendor_id = v.id
                GROUP BY v.id, v.vendor_name, v.email, l.is_approved
            `;
            const refRes = await client.query(referredQuery, [vendor.referral_id_list]);
            referralTree.push(...refRes.rows);
        }

        res.status(200).json({
            vendor,
            wallet,
            transactions,
            trades,
            referrals: referralTree
        });

    } catch (err) {
        console.error('❌ Error fetching full vendor profile:', err);
        res.status(500).json({ message: 'Server error while fetching vendor profile.' });
    } finally {
        client.release();
    }
};


// const sendWithdrawalRejectionEmail = (toEmail, vendorName, reason) => {
//   return new Promise((resolve, reject) => {
//     const scriptPath = path.join(__dirname, '../utils/sendWithdrawalRejectionEmail.py');

//     const python = spawn('python3', [scriptPath, toEmail, vendorName, reason]);

//     python.stdout.on('data', (data) => {
//       console.log(`Email Script Output: ${data}`);
//     });

//     python.stderr.on('data', (data) => {
//       console.error(`Email Script Error: ${data}`);
//     });

//     python.on('close', (code) => {
//       if (code === 0) {
//         resolve('Email sent successfully');
//       } else {
//         reject(new Error(`Python script exited with code ${code}`));
//       }
//     });
//   });
// };

const getPendingWalletTransactions = async (req, res) => {
    const client = await db.connect();
    try {
        const query = `
            SELECT
                t.trans_id, t.user_id, t.transaction_type, t.amount, t.status, t.description,
                t.upi_transaction_id, t.payment_proof_url, t.created_at as created_at, u.vendor_name, u.email,
                u.bank_name, u.account_number, u.ifsc_code, w.digital_money as current_balance
            FROM transaction t
            JOIN vendors u ON t.user_id = u.id
            LEFT JOIN wallet w ON t.user_id = w.id
            WHERE t.status = 'pending' AND (t.transaction_type = 'deposit' OR t.transaction_type = 'withdrawal')
            ORDER BY t.created_at ASC;
        `;
        const { rows } = await client.query(query);

        // Convert timestamps to IST for frontend display
        const formattedRows = rows.map(row => formatTimestampsForDisplay(row, ['created_at']));

        res.json(formattedRows);
    } catch (error) {
        console.error('Error fetching pending wallet transactions:', error);
        res.status(500).json({ message: 'Server error' });
    } finally {
        client.release();
    }
};

const reviewWalletTransaction = async (req, res) => {
    const { transactionId, decision, comment } = req.body;
    if (!transactionId || !decision || (decision === 'rejected' && !comment)) {
        return res.status(400).json({ message: 'Missing required fields for review.' });
    }
    const client = await db.connect();
    try {
        await client.query('BEGIN');
        const transactionRes = await client.query("SELECT * FROM transaction WHERE trans_id = $1 AND status = 'pending' FOR UPDATE", [transactionId]);
        if (transactionRes.rows.length === 0) {
            throw new Error('Transaction not found or has already been reviewed.');
        }
        const transaction = transactionRes.rows[0];
        const userId = transaction.user_id;
        const amount = parseFloat(transaction.amount);

        
        if (decision === 'approved') {
            let balanceAfterTransaction;
            
            if (transaction.transaction_type === 'deposit') {
                const updatedWallet = await client.query('UPDATE wallet SET digital_money = digital_money + $1 WHERE id = $2 RETURNING digital_money', [amount, userId]);
                balanceAfterTransaction = parseFloat(updatedWallet.rows[0].digital_money);
            } else if (transaction.transaction_type === 'withdrawal') {
                const walletRes = await client.query('SELECT digital_money FROM wallet WHERE id = $1 FOR UPDATE', [userId]);
                if (walletRes.rows[0].digital_money < amount) {
                    throw new Error('User balance is insufficient for this withdrawal.');
                }
                const updatedWallet = await client.query('UPDATE wallet SET digital_money = digital_money - $1 WHERE id = $2 RETURNING digital_money', [amount, userId]);
                balanceAfterTransaction = parseFloat(updatedWallet.rows[0].digital_money);
            }
            
            await client.query("UPDATE transaction SET status = 'approved', admin_comment = $1, balance_after_transaction = $2 WHERE trans_id = $3", [comment || 'Approved by admin', balanceAfterTransaction, transactionId]);
        } else { // Decision is 'rejected'
            // For rejected transactions, we don't update balance_after_transaction since the wallet wasn't affected
            await client.query("UPDATE transaction SET status = 'rejected', admin_comment = $1 WHERE trans_id = $2", [comment, transactionId]);
        }
        await client.query('COMMIT');

        // Send to external API after approval (non-blocking)
        if (decision === 'approved' && (transaction.transaction_type === 'deposit' || transaction.transaction_type === 'withdrawal')) {
            try {
                console.log(`🔍 Sending approved ${transaction.transaction_type} to external API:`, transactionId);
                await autoSendTransactionToAPI(transactionId);
                console.log(`✅ ${transaction.transaction_type} sent to external API successfully`);
            } catch (error) {
                console.error(`❌ Failed to send ${transaction.transaction_type} to external API:`, error);
                // Don't fail the main transaction if external API fails
            }
        }
        // if (decision === 'rejected' && transaction.transaction_type === 'withdrawal') {
        // const vendorRes = await client.query('SELECT vendor_name, email FROM vendors WHERE id = $1', [transaction.user_id]);
        //  if (vendorRes.rows.length > 0) {
        // const { vendor_name, email } = vendorRes.rows[0];
        // try {
        //     await sendWithdrawalRejectionEmail(email, vendor_name, comment);
        //     console.log(`✅ Rejection email sent to ${email}`);
        // } catch (err) {
        //     console.error('❌ Failed to send rejection email:', err);
        // }
//     }
// }

// --- User notification emails ---
if (decision === 'approved') {
  const { rows: vrows } = await client.query('SELECT vendor_name, email FROM vendors WHERE id = $1', [userId]);
  if (vrows.length) {
    const { vendor_name, email } = vrows[0];

    if (transaction.transaction_type === 'deposit') {
      await runPy('../utils/sendGenericUserEmail.py', [
        email,
        'Deposit approved',
        `Dear ${vendor_name},

Your deposit of ₹${amount.toFixed(2)} has been approved and added to your wallet.

Regards,
ESE Paper Pvt. Ltd.`
      ]);
    }

    if (transaction.transaction_type === 'withdrawal') {
      // This serves as “withdrawal sent” confirmation
      await runPy('../utils/sendGenericUserEmail.py', [
        email,
        'Withdrawal approved and sent',
        `Dear ${vendor_name},

Your withdrawal of ₹${amount.toFixed(2)} has been approved and is being processed to your registered bank account.

Regards,
ESE Paper Pvt. Ltd.`
      ]);
    }
  }
}



if (decision === 'rejected') {
  const { rows: vrows } = await client.query(
    'SELECT vendor_name, email FROM vendors WHERE id = $1',
    [userId]
  );
  if (vrows.length) {
    const { vendor_name, email } = vrows[0];

    if (transaction.transaction_type === 'withdrawal') {
      // you already have this one
      try {
        await runPy('../utils/sendGenericUserEmail.py', [
          email,
          'Withdrawal rejected',
          `Dear ${vendor_name},

We regret to inform you that your recent withdrawal request has been rejected.

Reason:
${comment || 'Not specified'}

Your money remains in your ESE Paper wallet. If you need clarification, reply to this email or call 7075923765.

Regards,
ESE Paper Pvt. Ltd.`
        ]);
      } catch (e) {
        console.error('User email failed (withdrawal rejected):', e?.message || e);
      }
    }

    if (transaction.transaction_type === 'deposit') {
      // ✅ NEW: deposit rejection email
      try {
        await runPy('../utils/sendGenericUserEmail.py', [
          email,
          'Deposit rejected',
          `Dear ${vendor_name},

We’re sorry—your deposit of ₹${amount.toFixed(2)} has been rejected.

Reason:
${comment || 'Not specified'}

If this was a mistake, please re-submit with correct details (matching UPI ID/Txn ID) or reply to this email for help.

Regards,
ESE Paper Pvt. Ltd.`
        ]);
      } catch (e) {
        console.error('User email failed (deposit rejected):', e?.message || e);
      }
    }
  }
}



        res.json({ message: `Transaction successfully ${decision}.` });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error reviewing wallet transaction:', error);
        res.status(500).json({ message: error.message || 'Server error during transaction review.' });
    } finally {
        client.release();
    }
};

// backend/api/controllers/adminController.js

const getAllVendors = async (req, res) => {
    try {
        const query = `
            SELECT
                v.id AS vendor_id,
                v.vendor_name,
                v.email,
                v.phone_number,
                v.aadhar_number,
                v.pan_card_number,
                v.bank_name,
                v.account_number,
                v.ifsc_code,
                v.employee_count,
                v.coordinator_id,
                c.name AS coordinator_name,
                l.status,
                l.role
            FROM vendors v
            JOIN login l ON v.id = l.user_id
            LEFT JOIN coordinator c ON v.coordinator_id = c.coordinator_id
            WHERE l.role = 'vendor' AND l.is_approved = TRUE
            ORDER BY v.vendor_name ASC;
        `;

        const { rows } = await db.query(query);
        res.status(200).json(rows);
    } catch (error) {
        console.error('❌ Error fetching all vendors:', error);
        res.status(500).json({ message: 'Failed to fetch the list of all vendors.' });
    }
};


const getRecentVendors = async (req, res) => {
    try {
        const query = `
            SELECT v.vendor_name, v.passport_photo_url
            FROM vendors v
            JOIN login l ON v.id = l.user_id
            WHERE l.role = 'vendor' AND l.is_approved = TRUE
            ORDER BY v.created_at DESC LIMIT 5;
        `;
        const { rows } = await db.query(query);
        res.status(200).json(rows);
    } catch (error) {
        console.error('❌ Error fetching recent vendors:', error);
        res.status(500).json({ message: 'Failed to fetch recent vendors.' });
    }
};

/**
 * @desc    Update vendor coordinator assignment
 * @route   PUT /api/admin/update-vendor-coordinator/:vendorId
 * @access  Private (Admin)
 */
const updateVendorCoordinator = async (req, res) => {
    const { vendorId } = req.params;
    const { coordinator_id } = req.body;

    // Allow empty coordinator_id to remove coordinator assignment
    if (coordinator_id === undefined || coordinator_id === null) {
        return res.status(400).json({ message: 'Coordinator ID is required.' });
    }

    // Validate coordinator exists only if coordinator_id is not empty
    if (coordinator_id !== '') {
        const coordinatorCheck = await db.query(
            'SELECT coordinator_id, name FROM coordinator WHERE coordinator_id = $1',
            [coordinator_id]
        );

        if (coordinatorCheck.rows.length === 0) {
            return res.status(400).json({ message: 'Invalid coordinator selected.' });
        }
    }

    try {
        const query = `
            UPDATE vendors
            SET coordinator_id = $1, updated_at = NOW()
            WHERE id = $2
            RETURNING *;
        `;

        const { rows } = await db.query(query, [coordinator_id || null, vendorId]);

        if (rows.length === 0) {
            return res.status(404).json({ message: 'Vendor not found.' });
        }

        console.log('✅ Vendor coordinator updated:', {
            vendorId,
            coordinator_id: coordinator_id || 'No Coordinator',
            action: coordinator_id ? 'Assigned' : 'Removed'
        });

        res.status(200).json({
            success: true,
            vendor: rows[0],
            message: coordinator_id ? 'Vendor coordinator updated successfully.' : 'Coordinator removed from vendor successfully.'
        });
    } catch (error) {
        console.error('❌ Error updating vendor coordinator:', error);
        res.status(500).json({ message: 'Failed to update vendor coordinator.' });
    }
};


// =================================================================
// --- VENDOR MANAGEMENT (Your existing functions) ---
// =================================================================
const getPendingVendors = async (req, res) => {
    try {
        const query = `
            SELECT v.id, v.email, v.vendor_name, v.phone_number, v.aadhar_number, 
                   v.pan_card_number, v.employee_count, v.bank_name, v.account_number,
                   v.ifsc_code, v.address, v.passport_photo_url, v.payment_screenshot_url, v.transaction_id
            FROM vendors v
            JOIN login l ON v.id = l.user_id
            WHERE l.role = 'vendor' AND l.is_approved = FALSE
            AND l.status != 'rejected'
            
            ORDER BY v.created_at ASC;
        `;
        const { rows } = await db.query(query);
        res.status(200).json(rows);
    } catch (error) {
        console.error('❌ Error fetching pending vendors:', error);
        res.status(500).json({ message: 'Failed to fetch pending vendors.' });
    }
};

// const approveVendor = async (req, res) => {
//     const { vendorId } = req.params;
//     if (!vendorId) return res.status(400).json({ message: 'Vendor ID is required.' });
//     try {
//         const updateQuery = `UPDATE login SET is_approved = TRUE, status = 'approved' WHERE user_id = $1 AND role = 'vendor' AND is_approved = FALSE`;
//         const result = await db.query(updateQuery, [vendorId]);
//         if (result.rowCount === 0) {
//             return res.status(404).json({ message: 'No pending vendor found with this ID. They may have already been approved.' });
//         }
//         res.status(200).json({ message: 'Vendor approved successfully!' });
//     } catch (error) {
//         console.error(`❌ Error approving vendor ${vendorId}:`, error);
//         res.status(500).json({ message: 'Failed to approve vendor.' });
//     }
// };

// --- RESOLVED: Kept your existing rejectVendor function ---
// This preserves your feature of deleting from the local database without cloud logic.


// backend/api/controllers/adminController.js

// ... other functions in the file

const approveVendor = async (req, res) => {
    const { vendorId } = req.params;
    if (!vendorId) {
        return res.status(400).json({ message: 'Vendor ID is required.' });
    }

    // Use a client from the pool to handle the transaction
    const client = await db.connect();

    try {
        // --- Step 1: Start the Transaction ---
        await client.query('BEGIN');

        // --- Step 2: Approve the vendor in the 'login' table ---
        const updateQuery = `
            UPDATE login 
            SET is_approved = TRUE, status = 'approved' 
            WHERE user_id = $1 AND role = 'vendor' AND is_approved = FALSE`;
        
        const result = await client.query(updateQuery, [vendorId]);

        // If no rows were updated, the vendor was likely already approved.
        // Rollback and return an error to prevent creating a duplicate transaction.
        if (result.rowCount === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: 'No pending vendor found with this ID. They may have already been approved.' });
        }

        // --- Step 3: Record the registration fee in the 'transaction' table ---
        const registrationFee = 4999;
        const transactionDescription = 'Initial registration fee paid upon approval.';
        
        const insertTransactionQuery = `
            INSERT INTO transaction 
                (user_id, transaction_type, amount, status, description)
            VALUES ($1, 'registration_fee', $2, 'approved', $3)`;
            
        await client.query(insertTransactionQuery, [vendorId, registrationFee, transactionDescription]);

        // --- Step 4: Commit the transaction if both operations succeed ---
        await client.query('COMMIT');

        const { rows } = await db.query('SELECT email, vendor_name FROM vendors WHERE id = $1', [vendorId]);
        if (rows.length) {
        const { runPy } = require('../utils/emailRunner');
        const subject = 'Your account has been approved';
        const body =
        `Dear ${rows[0].vendor_name},

        Your ESE Paper account has been approved. You can now set your password and log in.

        Regards,
        ESE Paper Pvt. Ltd.`;
        await runPy('../utils/sendGenericUserEmail.py', [rows[0].email, subject, body]);
        }


        res.status(200).json({ message: 'Vendor approved successfully and transaction recorded.' });

    } catch (error) {
        // If any error occurs, rollback the entire transaction
        await client.query('ROLLBACK');
        console.error(`❌ Error approving vendor ${vendorId}:`, error);
        res.status(500).json({ message: 'Failed to approve vendor due to a server error.' });
    } finally {
        // VERY IMPORTANT: Always release the client back to the pool
        client.release();
    }
};


// ... rest of the functions in adminController.js and the module.exports
const rejectVendor = async (req, res) => {
    const { vendorId } = req.params;
    if (!vendorId) {
        return res.status(400).json({ message: 'Vendor ID is required.' });
    }

    const client = await db.connect();

    try {
        await client.query('BEGIN');

        // Fetch vendor email and name
        const vendorRes = await client.query(
            'SELECT vendor_name, email FROM vendors WHERE id = $1',
            [vendorId]
        );

        if (vendorRes.rows.length === 0) {
            throw new Error('Vendor not found.');
        }

        const { vendor_name, email } = vendorRes.rows[0];

        // ✅ Update status only (DO NOT delete)
        const loginUpdateResult = await client.query(
            `UPDATE login SET is_approved = FALSE, status = 'rejected' WHERE user_id = $1 AND role = 'vendor'`,
            [vendorId]
        );

        if (loginUpdateResult.rowCount === 0) {
            throw new Error('Vendor login not found or already rejected.');
        }

        await client.query('COMMIT');

        // // ✅ Send rejection email
        // const pythonPath = path.join(__dirname, '..', 'utils', 'sendRejectionEmail.py');
        // execFile('python3', [pythonPath, email, vendor_name], (error, stdout, stderr) => {
        //     if (error) {
        //         console.error(`❌ Failed to send rejection email: ${error.message}`);
        //     } else {
        //         console.log(`📧 Rejection email sent: ${stdout}`);
        //     }
        // });


        // ✅ Send rejection email (generic)
await runPy('../utils/sendGenericUserEmail.py', [
  email,
  'Application rejected',
  `Dear ${vendor_name},

We regret to inform you that your application has been rejected.

For any refund-related queries, please contact 7075923765.

Regards,
ESE Paper Pvt. Ltd.`
]);


        res.status(200).json({ message: 'Vendor marked as rejected. Email sent.' });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error(`❌ Error rejecting vendor ${vendorId}:`, error);
        res.status(500).json({ message: error.message || 'Failed to reject vendor.' });
    } finally {
        client.release();
    }
};


// =================================================================
// --- TRADING MANAGEMENT (Your existing functions) ---
// =================================================================
const getPendingTrades = async (req, res) => {
    try {
        const query = `
            SELECT 
                t.trade_id, t.no_of_stock_bought, t.total_amount_paid,
                t.transaction_id, t.payment_url, t.date,
                p.paper_type, p.selling_price, p.last_updated,
                v.vendor_name
            FROM trading t
            JOIN product p ON t.product_id = p.product_id
            JOIN vendors v ON t.vendor_id = v.id
            WHERE t.is_approved = 'pending'
            ORDER BY t.date ASC;
        `;
        const { rows } = await db.query(query);
        res.status(200).json(rows);
    } catch (error) {
        console.error('❌ Error fetching pending trades:', error);
        res.status(500).json({ message: 'Failed to fetch pending trades.' });
    }
};

const reviewTrade = async (req, res) => {
    const { tradeId, decision, comment } = req.body;
    if (!tradeId || !decision || !['approved', 'rejected'].includes(decision)) {
        return res.status(400).json({ message: 'Trade ID and a valid decision are required.' });
    }
    if (decision === 'rejected' && (!comment || comment.trim() === '')) {
        return res.status(400).json({ message: 'A comment is required for rejected trades.' });
    }
    const client = await db.connect();
    try {
        await client.query('BEGIN');
        const tradeRes = await client.query('SELECT * FROM trading WHERE trade_id = $1 FOR UPDATE', [tradeId]);
        if (tradeRes.rows.length === 0) throw new Error('Trade not found.');
        
        const trade = tradeRes.rows[0];
        if (trade.is_approved !== 'pending') {
            throw new Error(`This trade has already been ${trade.is_approved}.`);
        }

        if (decision === 'approved') {
            const stockCheck = await client.query('SELECT available_stock FROM product WHERE product_id = $1', [trade.product_id]);
            if (stockCheck.rows.length === 0 || stockCheck.rows[0].available_stock < trade.no_of_stock_bought) {
                throw new Error('Insufficient stock to approve this trade. The purchase cannot be fulfilled.');
            }
            await client.query(`UPDATE trading SET is_approved = 'approved' WHERE trade_id = $1`, [tradeId]);
            
            // Update stock and recalculate stock status
            const newStock = stockCheck.rows[0].available_stock - trade.no_of_stock_bought;
            const newStockStatus = calculateStockStatus(newStock);
            await client.query(`UPDATE product SET available_stock = $1, stock_status = $2 WHERE product_id = $3`, [newStock, newStockStatus, trade.product_id]);
        } else { // Decision is 'rejected'
            await client.query(`UPDATE trading SET is_approved = 'rejected', comment = $1 WHERE trade_id = $2`, [comment, tradeId]);
        }
        
        await client.query('COMMIT');
        res.status(200).json({ message: `Trade ${decision} successfully.` });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error(`❌ Error reviewing trade ${tradeId}:`, error);
        res.status(500).json({ message: error.message || 'Server error while reviewing trade.' });
    } finally {
        client.release();
    }
};


// =================================================================
// --- DASHBOARD STATS ---
// --- RESOLVED: Merged stats queries from both versions ---
// =================================================================
const getAdminDashboardStats = async (req, res) => {
    try {
        const vendorQuery = "SELECT COUNT(*) FROM login WHERE role = 'vendor' AND is_approved = FALSE AND status != 'rejected'" ;
        const tradeQuery = "SELECT COUNT(*) FROM trading WHERE is_approved = 'pending'";
        // This query for wallet stats is a new feature from the incoming version
        const walletQuery = "SELECT COUNT(*) FROM transaction WHERE status = 'pending' AND (transaction_type = 'deposit' OR transaction_type = 'withdrawal')";

        const [vendorResult, tradeResult, walletResult] = await Promise.all([
            db.query(vendorQuery),
            db.query(tradeQuery),
            db.query(walletQuery) // Added the new query
        ]);
        
        const stats = {
            pendingVendorApprovals: parseInt(vendorResult.rows[0].count, 10),
            pendingTradeApprovals: parseInt(tradeResult.rows[0].count, 10),
            pendingWalletApprovals: parseInt(walletResult.rows[0].count, 10), // Added the new stat
        };
        res.status(200).json(stats);
    } catch (error) {
        console.error('❌ Error fetching admin dashboard stats:', error);
        res.status(500).json({ message: 'Failed to fetch admin statistics.' });
    }
};

const getWalletsWithPercentages = async (req, res) => {
    const client = await db.connect();
    try {
        // Step 1: Sync wallets for all approved users (this logic is correct and remains)
        const missingWalletsResult = await client.query(`
            SELECT l.user_id 
            FROM login l
            LEFT JOIN wallet w ON l.user_id = w.id
            WHERE l.is_approved = true AND w.id IS NULL
        `);

        if (missingWalletsResult.rows.length > 0) {
            console.log(`Found ${missingWalletsResult.rows.length} approved users missing a wallet. Creating now...`);
            for (const user of missingWalletsResult.rows) {
                const userId = user.user_id;
                const idRes = await client.query(`SELECT wallet_id FROM wallet ORDER BY CAST(SUBSTRING(wallet_id FROM 3) AS INTEGER) DESC LIMIT 1`);
                let nextNum = 1;
                if (idRes.rows.length > 0 && idRes.rows[0].wallet_id) {
                    const lastIdNum = parseInt(idRes.rows[0].wallet_id.split('_')[1], 10);
                    if (!isNaN(lastIdNum)) nextNum = lastIdNum + 1;
                }
                const walletId = `w_${String(nextNum).padStart(3, '0')}`;
                // Simplified insert for new wallet schema
                await client.query('INSERT INTO wallet (wallet_id, id, digital_money) VALUES ($1, $2, $3)', [walletId, userId, 0]);
                console.log(`Created wallet ${walletId} for user ${userId}`);
            }
        }

        // --- THE FIX IS HERE ---
        // Step 2: Use the updated query with disambiguation and new percentage logic
        const query = `
            WITH ReferralAggregates AS (
                SELECT
                    v_referrer.id AS referrer_id,
                    COUNT(DISTINCT l.user_id) FILTER (WHERE l.is_approved = true) AS total_referrals,
                    COALESCE(SUM(t.total_amount_paid) FILTER (WHERE t.is_approved = 'approved'), 0) AS total_spent_by_referrals
                FROM
                    vendors AS v_referrer,
                    -- DISAMBIGUATION: Use a unique alias like 'ref_id_from_list'
                    unnest(v_referrer.referral_id_list) AS ref_id_from_list
                LEFT JOIN
                    login AS l ON l.user_id = ref_id_from_list
                LEFT JOIN
                    trading AS t ON t.vendor_id = ref_id_from_list
                GROUP BY
                    v_referrer.id
            )
            SELECT
                w.id AS user_id,
                v.vendor_name AS name,
                -- UPDATED PERCENTAGE LOGIC: Select the new, simple columns
                w.percentage AS current_percentage,
                w.last_updated_on,
                COALESCE(ra.total_referrals, 0)::int AS total_referrals,
                COALESCE(ra.total_spent_by_referrals, 0)::float AS total_spent_by_referrals
            FROM wallet w
            JOIN vendors v ON w.id = v.id
            LEFT JOIN ReferralAggregates ra ON w.id = ra.referrer_id
            ORDER BY v.vendor_name;
        `;
        
        const result = await client.query(query);
        res.status(200).json(result.rows);

    } catch (error) {
        console.error('❌ Error in getWalletsWithPercentages (sync & fetch):', error);
        res.status(500).json({ message: 'Server error while fetching or syncing wallet data.' });
    } finally {
        if (client) client.release();
    }
};

const updateUserPercentage = async (req, res) => {
    const { userId, newPercentage } = req.body;

    if (userId === undefined || newPercentage === undefined) {
        return res.status(400).json({ message: 'User ID and a new percentage are required.' });
    }

    const percentageValue = parseFloat(newPercentage);
    if (isNaN(percentageValue) || percentageValue < 0) {
        return res.status(400).json({ message: 'A valid, non-negative percentage is required.' });
    }

    // --- NEW SIMPLER LOGIC ---
    // Use a transaction to ensure both wallet and past trades are updated together.
    const client = await db.connect();
    try {
        await client.query('BEGIN');

        // Step 1: Update the WALLET with the new percentage and the current timestamp.
        const walletUpdateResult = await client.query(
            `UPDATE wallet 
             SET 
                percentage = $1, 
                last_updated_on = NOW()
             WHERE id = $2`,
            [percentageValue, userId]
        );

        if (walletUpdateResult.rowCount === 0) {
            throw new Error('User or wallet not found.');
        }

        // Step 2: Backfill any past, approved trades that are missing a percentage.
        // This logic remains the same and is still very useful.
        const backfillUpdateResult = await client.query(
            `UPDATE trading
             SET percentage = $1
             WHERE referred_id = $2
               AND is_approved = 'approved'
               AND percentage IS NULL`,
            [percentageValue, userId]
        );

        console.log(`Backfilled percentage for ${backfillUpdateResult.rowCount} past trades for referrer ${userId}.`);

        await client.query('COMMIT');

        res.status(200).json({ 
            message: `Successfully set percentage for user ${userId} to ${percentageValue}%. ${backfillUpdateResult.rowCount} past trades were updated.` 
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error(`❌ Error updating percentage for user ${userId}:`, error);
        
        if (error.message === 'User or wallet not found.') {
            return res.status(404).json({ message: error.message });
        }
        res.status(500).json({ message: 'Server error while updating percentage.' });
    } finally {
        if (client) client.release();
    }
};




// const getAllVendorsPaginated = async (req, res) => {
//     try {
//         const {
//             page = 1,
//             limit = 10,
//             sortBy = 'created_at',
//             sortOrder = 'desc',
//             search = ''
//         } = req.query;

//         // --- Define allowed columns for sorting to prevent SQL injection ---
//         const allowedSortBy = [
//             'vendor_name', 'id', 'email', 'phone_number', 'created_at', 'digital_money'
//         ];
//         if (!allowedSortBy.includes(sortBy)) {
//             return res.status(400).json({ message: 'Invalid sort column.' });
//         }
        
//         // --- Map sortBy to the correct table and column name ---
//         let sortColumn;
//         switch (sortBy) {
//             case 'digital_money':
//                 sortColumn = 'w.digital_money';
//                 break;
//             case 'created_at':
//                 sortColumn = 'v.created_at';
//                 break;
//             default:
//                 sortColumn = `v.${sortBy}`;
//         }
        
//         const sanitizedSortOrder = sortOrder.toLowerCase() === 'asc' ? 'ASC' : 'DESC';

//         // --- Build the query ---
//         const queryParams = [];
//         let baseQuery = `
//             FROM vendors v
//             JOIN login l ON v.id = l.user_id
//             LEFT JOIN wallet w ON v.id = w.id
//             WHERE l.is_approved = TRUE AND l.role = 'vendor'
//         `;

//         if (search) {
//             queryParams.push(`%${search}%`);
//             const searchIndex = queryParams.length;
//             baseQuery += ` AND (v.vendor_name ILIKE $${searchIndex} OR v.id ILIKE $${searchIndex} OR v.email ILIKE $${searchIndex} OR v.phone_number ILIKE $${searchIndex})`;
//         }
        
//         // --- Get Total Count for Pagination ---
//         const countQuery = `SELECT COUNT(*) ${baseQuery}`;
//         const totalResult = await db.query(countQuery, queryParams);
//         const totalCount = parseInt(totalResult.rows[0].count, 10);

//         // --- Get Paginated Data ---
//         const offset = (page - 1) * limit;
//         const dataQuery = `
//             SELECT 
//                 v.id,
//                 v.vendor_name,
//                 v.email,
//                 v.phone_number,
//                 v.created_at AS joining_date,
//                 v.passport_photo_url,
//                 COALESCE(w.digital_money, 0) AS wallet_balance
//             ${baseQuery}
//             ORDER BY ${sortColumn} ${sanitizedSortOrder}
//             LIMIT $${queryParams.length + 1} 
//             OFFSET $${queryParams.length + 2}
//         `;
//         const dataResult = await db.query(dataQuery, [...queryParams, limit, offset]);

//         res.status(200).json({
//             data: dataResult.rows,
//             totalCount,
//             page: parseInt(page, 10),
//             limit: parseInt(limit, 10),
//             totalPages: Math.ceil(totalCount / limit)
//         });

//     } catch (error) {
//         console.error('❌ Error fetching paginated vendors:', error);
//         res.status(500).json({ message: 'Server error while fetching vendors.' });
//     }
// };


// Find the getAllVendorsPaginated function and update the SELECT statement

// const getAllVendorsPaginated = async (req, res) => {
//     try {
//         const {
//             page = 1,
//             // ✅ NEW: Get limit from query, with a default of 10
//             limit = 10,
//             sortBy = 'created_at',
//             sortOrder = 'desc',
//             search = ''
//         } = req.query;

//         const allowedSortBy = [
//             'vendor_name', 'id', 'email', 'phone_number', 
//             'created_at', 'digital_money', 'percentage' // ✅ Add 'percentage' to allowed sort columns
//         ];
//         if (!allowedSortBy.includes(sortBy)) {
//             return res.status(400).json({ message: 'Invalid sort column.' });
//         }
        
//         let sortColumn;
//         switch (sortBy) {
//             case 'digital_money':
//                 sortColumn = 'w.digital_money';
//                 break;
//             case 'percentage': // ✅ Add case for percentage
//                 sortColumn = 'w.percentage';
//                 break;
//             case 'created_at':
//                 sortColumn = 'v.created_at';
//                 break;
//             default:
//                 sortColumn = `v.${sortBy}`;
//         }
        
//         const sanitizedSortOrder = sortOrder.toLowerCase() === 'asc' ? 'ASC' : 'DESC';

//         const queryParams = [];
//         let baseQuery = `
//             FROM vendors v
//             JOIN login l ON v.id = l.user_id
//             LEFT JOIN wallet w ON v.id = w.id
//             WHERE l.is_approved = TRUE AND l.role = 'vendor'
//         `;

//         if (search) {
//             queryParams.push(`%${search}%`);
//             const searchIndex = queryParams.length;
//             baseQuery += ` AND (v.vendor_name ILIKE $${searchIndex} OR v.id ILIKE $${searchIndex} OR v.email ILIKE $${searchIndex} OR v.phone_number ILIKE $${searchIndex})`;
//         }
        
//         const countQuery = `SELECT COUNT(*) ${baseQuery}`;
//         const totalResult = await db.query(countQuery, queryParams);
//         const totalCount = parseInt(totalResult.rows[0].count, 10);

//         const offset = (page - 1) * limit;
        
//         const dataQuery = `
//             SELECT 
//                 v.id,
//                 v.vendor_name,
//                 v.email,
//                 v.phone_number,
//                 v.created_at AS joining_date,
//                 v.passport_photo_url,
//                 COALESCE(w.digital_money, 0) AS wallet_balance,
//                 w.percentage -- ✅ THIS IS THE NEW LINE TO SELECT THE PERCENTAGE
//             ${baseQuery}
//             ORDER BY ${sortColumn} ${sanitizedSortOrder} NULLS LAST
//             LIMIT $${queryParams.length + 1} 
//             OFFSET $${queryParams.length + 2}
//         `;
//         // Added NULLS LAST to the ORDER BY to handle vendors without a percentage set yet.
        
//         const dataResult = await db.query(dataQuery, [...queryParams, limit, offset]);

//         res.status(200).json({
//             data: dataResult.rows,
//             totalCount,
//             page: parseInt(page, 10),
//             limit: parseInt(limit, 10),
//             totalPages: Math.ceil(totalCount / limit)
//         });

//     } catch (error) {
//         console.error('❌ Error fetching paginated vendors:', error);
//         res.status(500).json({ message: 'Server error while fetching vendors.' });
//     }
// };



/**
 * @desc    Get a paginated, searchable, and sortable list of ALL vendors (approved or not).
 * @route   GET /api/admin/vendors/paginated
 * @access  Private (Admin)
 */
const getAllVendorsPaginated = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 10,
            sortBy = 'created_at',
            sortOrder = 'desc',
            search = ''
        } = req.query;

        // ✅ Define allowed columns for sorting
        const allowedSortBy = [
            'vendor_name', 'id', 'email', 'phone_number', 
            'created_at', 'digital_money', 'percentage', 'status'
        ];
        if (!allowedSortBy.includes(sortBy)) {
            return res.status(400).json({ message: 'Invalid sort column.' });
        }
        
        // ✅ Map sortBy to the correct table and column name
        let sortColumn;
        switch (sortBy) {
            case 'digital_money': sortColumn = 'w.digital_money'; break;
            case 'percentage':    sortColumn = 'w.percentage'; break;
            case 'created_at':    sortColumn = 'v.created_at'; break;
            case 'status':        sortColumn = 'l.status'; break;
            default:              sortColumn = `v.${sortBy}`;
        }
        
        const sanitizedSortOrder = sortOrder.toLowerCase() === 'asc' ? 'ASC' : 'DESC';

        const queryParams = [];
        // ✅ Simplified base query to fetch all vendors regardless of approval status initially
        let baseQuery = `
            FROM vendors v
            JOIN login l ON v.id = l.user_id
            LEFT JOIN wallet w ON v.id = w.id
            LEFT JOIN coordinator c ON v.coordinator_id = c.coordinator_id
            WHERE l.role = 'vendor'
        `;



        // ✅ Robust search across multiple relevant columns
        if (search) {
            queryParams.push(`%${search}%`);
            const searchIndex = queryParams.length;
            baseQuery += ` AND (v.vendor_name ILIKE $${searchIndex} OR v.id ILIKE $${searchIndex} OR v.email ILIKE $${searchIndex} OR v.phone_number ILIKE $${searchIndex} OR l.status ILIKE $${searchIndex})`;
        }
        
        // --- Get Total Count for Pagination ---
        const countQuery = `SELECT COUNT(*) ${baseQuery}`;
        const totalResult = await db.query(countQuery, queryParams);
        const totalCount = parseInt(totalResult.rows[0].count, 10);

        // --- Get Paginated Data ---
        const offset = (page - 1) * limit;
        const dataQuery = `
            SELECT 
                v.id,
                v.vendor_name,
                v.email,
                v.phone_number,
                v.created_at AS joining_date,
                v.passport_photo_url,
                l.status, -- ✅ Fetching the status from login table
                COALESCE(w.digital_money, 0) AS wallet_balance,
                w.percentage,
                v.coordinator_id,
                c.name AS coordinator_name,
                v.product_visibility
            ${baseQuery}
            ORDER BY ${sortColumn} ${sanitizedSortOrder} NULLS LAST
            LIMIT $${queryParams.length + 1} 
            OFFSET $${queryParams.length + 2}
        `;
        
        const dataResult = await db.query(dataQuery, [...queryParams, limit, offset]);

        res.status(200).json({
            data: dataResult.rows,
            totalCount,
            page: parseInt(page, 10),
            limit: parseInt(limit, 10),
            totalPages: Math.ceil(totalCount / limit)
        });

    } catch (error) {
        console.error('❌ Error fetching paginated vendors:', error);
        res.status(500).json({ message: 'Server error while fetching vendors.' });
    }
};

// GET /api/admin/vendors/all
// const getAllVendorsFull = async (req, res) => {
//     try {
//         const query = `
//             SELECT v.*, 
//                    l.status, 
//                    COALESCE(w.digital_money, 0) AS wallet_balance, 
//                    w.percentage
//             FROM vendors v
//             JOIN login l ON v.id = l.user_id
//             LEFT JOIN wallet w ON v.id = w.id
//             WHERE l.role = 'vendor'
//             ORDER BY v.id ASC
//         `;
//         const result = await db.query(query);
//         res.status(200).json(result.rows);
//     } catch (error) {
//         console.error(error);
//         res.status(500).json({ message: 'Server error while fetching vendors.' });
//     }
// };
const getAllVendorsFull = async (req, res) => {
    try {
        const query = `
            SELECT 
                v.id::text,
                v.vendor_name::text,
                v.email::text,
                v.phone_number::text,
                '''' || v.aadhar_number::text AS aadhar_number, -- ✅ Prepend a single quote
                '''' || v.account_number::text AS account_number, -- ✅ If account number exists
                v.joining_date::text,
                l.status::text, 
                '''' || COALESCE(w.digital_money, 0)::text AS wallet_balance, -- optional
                w.percentage::text
            FROM vendors v
            JOIN login l ON v.id = l.user_id
            LEFT JOIN wallet w ON v.id = w.id
            WHERE l.role = 'vendor'
            ORDER BY v.id ASC
        `;
        const result = await db.query(query);
        res.status(200).json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error while fetching vendors.' });
    }
};


// ... Remember to export it ...

// Get total approved vendor count for dashboard
const getVendorCount = async (req, res) => {
    try {
        const query = "SELECT COUNT(*) as total FROM login WHERE role = 'vendor' AND status = 'approved'";
        const result = await db.query(query);
        const totalVendors = parseInt(result.rows[0].total, 10);
        
        res.status(200).json({ totalVendors });
    } catch (error) {
        console.error('❌ Error fetching vendor count:', error);
        res.status(500).json({ message: 'Failed to fetch vendor count.' });
    }
};

// Get vendors from last 8 days (only approved)
const getVendorsLast8Days = async (req, res) => {
    try {
        const query = `
            SELECT COUNT(*) as count 
            FROM login l
            JOIN vendors v ON l.user_id = v.id
            WHERE l.role = 'vendor' 
            AND l.status = 'approved' 
            AND v.created_at >= NOW() - INTERVAL '8 days'
        `;
        const result = await db.query(query);
        const count = parseInt(result.rows[0].count, 10);
        
        res.status(200).json({ count });
    } catch (error) {
        console.error('❌ Error fetching last 8 days vendors:', error);
        res.status(500).json({ message: 'Failed to fetch last 8 days vendors.' });
    }
};

// Get today's vendors (all statuses)
const getTodayVendors = async (req, res) => {
    try {
        const query = `
            SELECT COUNT(*) as count 
            FROM login l
            JOIN vendors v ON l.user_id = v.id
            WHERE l.role = 'vendor' 
            AND DATE(v.created_at) = CURRENT_DATE
        `;
        const result = await db.query(query);
        const count = parseInt(result.rows[0].count, 10);
        
        res.status(200).json({ count });
    } catch (error) {
        console.error('❌ Error fetching today vendors:', error);
        res.status(500).json({ message: 'Failed to fetch today vendors.' });
    }
};

// Get paginated vendors from last 8 days with dedicated logic
const getVendorsLast8DaysPaginated = async (req, res) => {
    try {
        const { page = 1, limit = 10, search = '', sortBy = 'created_at', sortOrder = 'DESC' } = req.query;
        
        // Validate sortBy to prevent SQL injection
        const allowedSortFields = ['created_at', 'vendor_name', 'email', 'phone_number', 'id'];
        const validSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'created_at';
        
        // Validate sortOrder
        const validSortOrder = ['ASC', 'DESC'].includes(sortOrder.toUpperCase()) ? sortOrder.toUpperCase() : 'DESC';
        
        const offset = (parseInt(page) - 1) * parseInt(limit);
        
        // Build the base query without search first
        let baseQuery = `
            FROM vendors v
            JOIN login l ON v.id = l.user_id
            WHERE l.role = 'vendor' 
            AND l.status = 'approved' 
            AND v.created_at >= NOW() - INTERVAL '8 days'
        `;
        
        // Count total vendors matching criteria
        const countQuery = `SELECT COUNT(*) as total ${baseQuery}`;
        const countResult = await db.query(countQuery);
        const total = parseInt(countResult.rows[0].total, 10);
        
        // Add search condition if provided
        let finalBaseQuery = baseQuery;
        let vendorParams = [parseInt(limit), offset];
        
        if (search) {
            finalBaseQuery += ` AND (v.vendor_name ILIKE $3 OR v.email ILIKE $3 OR v.phone_number ILIKE $3)`;
            vendorParams.push(`%${search}%`);
        }
        
        // Get paginated vendors
        const vendorsQuery = `
            SELECT 
                v.id,
                v.vendor_name as name,
                v.email,
                v.phone_number as phone,
                v.created_at,
                l.status
            ${finalBaseQuery}
            ORDER BY v.${validSortBy} ${validSortOrder}
            LIMIT $1 OFFSET $2
        `;
            
        const vendorsResult = await db.query(vendorsQuery, vendorParams);
        
        const totalPages = Math.ceil(total / parseInt(limit));
        
        res.status(200).json({
            success: true,
            vendors: vendorsResult.rows,
            total,
            totalPages,
            currentPage: parseInt(page),
            limit: parseInt(limit)
        });
        
    } catch (error) {
        console.error('❌ Error fetching paginated vendors from last 8 days:', error);
        res.status(500).json({ 
            success: false,
            message: 'Failed to fetch vendors from last 8 days.' 
        });
    }
};

// Get paginated today's vendors with dedicated logic
const getTodaysVendorsPaginated = async (req, res) => {
    try {
        const { page = 1, limit = 10, search = '', sortBy = 'created_at', sortOrder = 'DESC' } = req.query;
        
        // Validate sortBy to prevent SQL injection
        const allowedSortFields = ['created_at', 'vendor_name', 'email', 'phone_number', 'id'];
        const validSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'created_at';
        
        // Validate sortOrder
        const validSortOrder = ['ASC', 'DESC'].includes(sortOrder.toUpperCase()) ? sortOrder.toUpperCase() : 'DESC';
        
        const offset = (parseInt(page) - 1) * parseInt(limit);
        
        // Build the base query without search first - show ALL statuses for today's vendors
        let baseQuery = `
            FROM vendors v
            JOIN login l ON v.id = l.user_id
            WHERE l.role = 'vendor' 
            AND DATE(v.created_at) = CURRENT_DATE
        `;
        
        // Count total vendors matching criteria
        const countQuery = `SELECT COUNT(*) as total ${baseQuery}`;
        const countResult = await db.query(countQuery);
        const total = parseInt(countResult.rows[0].total, 10);
        
        // Add search condition if provided
        let finalBaseQuery = baseQuery;
        let vendorParams = [parseInt(limit), offset];
        
        if (search) {
            finalBaseQuery += ` AND (v.vendor_name ILIKE $3 OR v.email ILIKE $3 OR v.phone_number ILIKE $3)`;
            vendorParams.push(`%${search}%`);
        }
        
        // Get paginated vendors
        const vendorsQuery = `
            SELECT 
                v.id,
                v.vendor_name as name,
                v.email,
                v.phone_number as phone,
                v.created_at,
                l.status
            ${finalBaseQuery}
            ORDER BY v.${validSortBy} ${validSortOrder}
            LIMIT $1 OFFSET $2
        `;
            
        const vendorsResult = await db.query(vendorsQuery, vendorParams);
        
        const totalPages = Math.ceil(total / parseInt(limit));
        
        res.status(200).json({
            success: true,
            vendors: vendorsResult.rows,
            total,
            totalPages,
            currentPage: parseInt(page),
            limit: parseInt(limit)
        });
        
    } catch (error) {
        console.error('❌ Error fetching paginated today\'s vendors:', error);
        res.status(500).json({ 
            success: false,
            message: 'Failed to fetch today\'s vendors.' 
        });
    }
};

// Get wallet statistics for admin dashboard
const getWalletStats = async (req, res) => {
    try {
        // Get total wallet amount from all users
        const totalWalletQuery = `
            SELECT COALESCE(SUM(digital_money), 0) as total_amount
            FROM wallet
        `;
        const totalWalletResult = await db.query(totalWalletQuery);
        const totalWalletAmount = parseFloat(totalWalletResult.rows[0].total_amount) || 0;

        // Get total withdrawn amount from transaction table
        const totalWithdrawnQuery = `
            SELECT COALESCE(SUM(amount), 0) as total_withdrawn
            FROM transaction
            WHERE transaction_type = 'withdrawal' AND status = 'approved'
        `;
        const totalWithdrawnResult = await db.query(totalWithdrawnQuery);
        const totalWithdrawnAmount = parseFloat(totalWithdrawnResult.rows[0].total_withdrawn) || 0;

        // Get total deposited amount from transaction table
        const totalDepositedQuery = `
            SELECT COALESCE(SUM(amount), 0) as total_deposited
            FROM transaction
            WHERE transaction_type = 'deposit' AND status = 'approved'
        `;
        const totalDepositedResult = await db.query(totalDepositedQuery);
        const totalDepositedAmount = parseFloat(totalDepositedResult.rows[0].total_deposited) || 0;

        res.status(200).json({
            totalWalletAmount,
            totalWithdrawnAmount,
            totalDepositedAmount
        });

    } catch (error) {
        console.error('❌ Error fetching wallet statistics:', error);
        res.status(500).json({ 
            message: 'Failed to fetch wallet statistics.',
            totalWalletAmount: 0,
            totalWithdrawnAmount: 0,
            totalDepositedAmount: 0
        });
    }
};

// Get referral tree for admin (for any vendor)
const getAdminReferralTree = async (req, res) => {
    const { vendorId } = req.params;
    
    console.log(`🔍 [DEBUG] getAdminReferralTree called for vendor ID: ${vendorId}`);
    
    if (!vendorId) {
        console.log(`❌ [DEBUG] No vendor ID provided`);
        return res.status(400).json({ message: 'Vendor ID is required.' });
    }

    try {
        console.log(`🔍 [DEBUG] Starting to fetch vendor information for ID: ${vendorId}`);
        
        // Get the vendor's own information
        const vendorQuery = `
            SELECT 
                v.id,
                COALESCE(v.vendor_name, 'Unknown') as name,
                COALESCE(l.email, 'no-email@example.com') as email,
                COALESCE(l.status, 'unknown') as status,
                COALESCE(w.digital_money, 0) as totalEarnings,
                COALESCE(SUM(t.total_amount_paid) FILTER (WHERE t.is_approved = 'approved'), 0) as "totalSpent"
            FROM vendors v
            JOIN login l ON v.id = l.user_id
            LEFT JOIN wallet w ON v.id = w.id
            LEFT JOIN trading t ON t.vendor_id = v.id
            WHERE v.id = $1
            GROUP BY v.id, v.vendor_name, l.email, l.status, w.digital_money
        `;
        
        const vendorResult = await db.query(vendorQuery, [vendorId]);
        console.log(`🔍 [DEBUG] Vendor query result:`, vendorResult.rows);
        
        if (vendorResult.rows.length === 0) {
            console.log(`❌ [DEBUG] Vendor not found in database`);
            return res.status(404).json({ message: 'Vendor not found.' });
        }
        
        const vendor = vendorResult.rows[0];
        console.log(`🔍 [DEBUG] Found vendor:`, vendor);
        
        // Get the list of referral IDs from referral_id_list
        const referralsResult = await db.query('SELECT referral_id_list FROM vendors WHERE id = $1', [vendorId]);
        const allReferralIds = referralsResult.rows[0]?.referral_id_list;
        
        console.log(`🔍 [DEBUG] All referral IDs found:`, allReferralIds);
        
        // Filter to only include approved vendors that exist
        let level1Referrals = [];
        
        if (allReferralIds && allReferralIds.length > 0) {
            const level1Query = `
                SELECT 
                    v.id,
                    COALESCE(v.vendor_name, 'Unknown') as name,
                    COALESCE(l.email, 'no-email@example.com') as email,
                    COALESCE(l.status, 'unknown') as status,
                    COALESCE(w.digital_money, 0) as totalEarnings,
                    COALESCE(SUM(t.total_amount_paid) FILTER (WHERE t.is_approved = 'approved'), 0) as "totalSpent"
                FROM vendors v
                JOIN login l ON v.id = l.user_id
                LEFT JOIN wallet w ON v.id = w.id
                LEFT JOIN trading t ON t.vendor_id = v.id
                WHERE v.id = ANY($1)
                AND l.is_approved = TRUE
                GROUP BY v.id, v.vendor_name, l.email, l.status, w.digital_money
            `;
            
            const level1Result = await db.query(level1Query, [allReferralIds]);
            level1Referrals = level1Result.rows;
            console.log(`🔍 [DEBUG] Approved Level 1 referrals found:`, level1Referrals.length);
        } else {
            console.log(`🔍 [DEBUG] No referrals found in referral_id_list`);
        }
        
        // Build the referral tree recursively
        const buildReferralTree = async (referrals) => {
            const tree = [];
            
            for (const referral of referrals) {
                try {
                    // Get referral count for this person - only count approved vendors
                    let referralCount = 0;
                    try {
                        const referralCountQuery = `
                            SELECT referral_id_list FROM vendors WHERE id = $1
                        `;
                        const referralCountResult = await db.query(referralCountQuery, [referral.id]);
                        const theirReferralIds = referralCountResult.rows[0]?.referral_id_list;
                        
                        if (theirReferralIds && theirReferralIds.length > 0) {
                            // Only count approved vendors
                            const approvedReferralsQuery = `
                                SELECT COUNT(*) as count 
                                FROM vendors v
                                JOIN login l ON v.id = l.user_id
                                WHERE v.id = ANY($1)
                                AND l.is_approved = TRUE
                            `;
                            const approvedReferralsResult = await db.query(approvedReferralsQuery, [theirReferralIds]);
                            referralCount = parseInt(approvedReferralsResult.rows[0].count);
                        } else {
                            referralCount = 0;
                        }
                    } catch (err) {
                        console.log(`🔍 [DEBUG] Error getting referral count for ${referral.id}:`, err.message);
                        referralCount = 0;
                    }
                    
                    referral.referralCount = referralCount;
                    
                    // Get their referrals (children) - only approved vendors
                    let children = [];
                    if (referralCount > 0) {
                        try {
                            const childrenQuery = `
                                SELECT 
                                    v.id,
                                    COALESCE(v.vendor_name, 'Unknown') as name,
                                    COALESCE(l.email, 'no-email@example.com') as email,
                                    COALESCE(l.status, 'unknown') as status,
                                    COALESCE(w.digital_money, 0) as totalEarnings,
                                    COALESCE(SUM(t.total_amount_paid) FILTER (WHERE t.is_approved = 'approved'), 0) as "totalSpent"
                                FROM vendors v
                                JOIN login l ON v.id = l.user_id
                                LEFT JOIN wallet w ON v.id = w.id
                                LEFT JOIN trading t ON t.vendor_id = v.id
                                WHERE v.id = ANY(
                                    SELECT unnest(referral_id_list) 
                                    FROM vendors 
                                    WHERE id = $1
                                )
                                AND l.is_approved = TRUE
                                GROUP BY v.id, v.vendor_name, l.email, l.status, w.digital_money
                            `;
                            const childrenResult = await db.query(childrenQuery, [referral.id]);
                            children = childrenResult.rows;
                            
                            // Recursively build children's trees
                            if (children.length > 0) {
                                children = await buildReferralTree(children);
                            }
                        } catch (err) {
                            console.log(`🔍 [DEBUG] Error getting children for ${referral.id}:`, err.message);
                            children = [];
                        }
                    }
                    
                    referral.children = children;
                    tree.push(referral);
                    
                } catch (err) {
                    console.log(`🔍 [DEBUG] Error processing referral ${referral.id}:`, err.message);
                }
            }
            
            return tree;
        };

        // Build the complete tree starting from level 1 referrals
        vendor.children = await buildReferralTree(level1Referrals);
        vendor.referralCount = level1Referrals.length;

        console.log(`🔍 [DEBUG] Final referral tree structure:`, JSON.stringify(vendor, null, 2));

        res.status(200).json(vendor);

    } catch (error) {
        console.error(`❌ Error fetching referral tree for vendor ${vendorId}:`, error);
        res.status(500).json({ 
            message: 'An internal server error occurred while fetching the referral tree.',
            error: error.message 
        });
    }
};

const getWithdrawalStats = async (req, res) => {
    try {
        const query = `
            SELECT 
                COALESCE(SUM(CASE WHEN status = 'approved' THEN amount ELSE 0 END), 0) as total_approved,
                COALESCE(SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END), 0) as total_pending,
                COUNT(CASE WHEN status = 'approved' THEN 1 END) as count_approved,
                COUNT(CASE WHEN status = 'pending' THEN 1 END) as count_pending
            FROM transaction
            WHERE transaction_type = 'withdrawal'
        `;
        
        const result = await db.query(query);
        const stats = result.rows[0];
        
        res.status(200).json({
            totalApproved: parseFloat(stats.total_approved || 0),
            totalPending: parseFloat(stats.total_pending || 0),
            countApproved: parseInt(stats.count_approved || 0),
            countPending: parseInt(stats.count_pending || 0)
        });

    } catch (error) {
        console.error('❌ Error fetching withdrawal stats:', error);
        res.status(500).json({ message: 'Server error while fetching withdrawal statistics.' });
    }
};

const getAllWithdrawals = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 10,
            sortBy = 'created_at',
            sortOrder = 'desc',
            search = '',
            startDate = '',
            endDate = '',
            status = '' // Filter by status (approved, pending, rejected, cancelled)
        } = req.query;

        const allowedSortBy = [
            'trans_id', 'created_at', 'user_id', 'vendor_name', 
            'transaction_type', 'amount', 'status', 'description'
        ];
        if (!allowedSortBy.includes(sortBy)) {
            return res.status(400).json({ message: 'Invalid sort column.' });
        }
        const sortColumn = sortBy === 'vendor_name' ? 'v.vendor_name' : `t.${sortBy}`;
        const sanitizedSortOrder = sortOrder.toLowerCase() === 'asc' ? 'ASC' : 'DESC';

        const queryParams = [];
        let baseQuery = `
            FROM transaction t 
            LEFT JOIN vendors v ON t.user_id = v.id 
            WHERE t.transaction_type = 'withdrawal'
        `;

        // Search filter
        if (search) {
            queryParams.push(`%${search}%`);
            const searchIndex = queryParams.length;
            baseQuery += ` AND (t.user_id ILIKE $${searchIndex} OR t.description ILIKE $${searchIndex} OR v.vendor_name ILIKE $${searchIndex} OR v.email ILIKE $${searchIndex} OR v.phone_number ILIKE $${searchIndex})`;
        }

        // Status filter
        if (status) {
            queryParams.push(status);
            baseQuery += ` AND t.status = $${queryParams.length}`;
        }

        // Date filters
        if (startDate) {
            queryParams.push(startDate);
            baseQuery += ` AND t.created_at >= $${queryParams.length}`;
        }
        if (endDate) {
            queryParams.push(endDate);
            baseQuery += ` AND t.created_at < ($${queryParams.length}::date + interval '1 day')`;
        }
        
        const countQuery = `SELECT COUNT(*) ${baseQuery}`;
        const totalResult = await db.query(countQuery, queryParams);
        const totalCount = parseInt(totalResult.rows[0].count, 10);

        const offset = (page - 1) * limit;
        
        const dataQuery = `
            SELECT 
                t.trans_id, 
                t.created_at,
                t.user_id, 
                t.transaction_type, 
                t.amount, 
                t.status, 
                t.description,
                t.admin_comment,
                v.vendor_name, 
                v.email, 
                v.phone_number
            ${baseQuery}
            ORDER BY ${sortColumn} ${sanitizedSortOrder}
            LIMIT $${queryParams.length + 1} 
            OFFSET $${queryParams.length + 2}
        `;
        const dataResult = await db.query(dataQuery, [...queryParams, limit, offset]);

        const processedData = dataResult.rows.map(row => formatTimestampsForDisplay(row, ['created_at']));

        res.status(200).json({
            data: processedData,
            totalCount,
            page: parseInt(page, 10),
            limit: parseInt(limit, 10),
            totalPages: Math.ceil(totalCount / limit)
        });

    } catch (error) {
        console.error('❌ Error fetching withdrawals:', error);
        res.status(500).json({ message: 'Server error while fetching withdrawals.' });
    }
};

// =================================================================
// --- INVESTOR APPROVAL FUNCTIONS ---
// =================================================================

/**
 * GET: Get all pending investors for approval
 */
const getPendingInvestors = async (req, res) => {
    try {
        const query = `
            SELECT 
                i.id,
                i.first_name,
                i.mobile_number,
                i.pan_card,
                i.coordinator_id,
                i.co_name,
                i.bank_account_number,
                i.bank_name,
                i.branch_name,
                i.ifsc_code,
                i.mode_of_payment,
                i.plan_type,
                i.select_plan,
                i.transaction_id,
                i.address,
                i.investment_date,
                i.created_at,
                c.name as coordinator
            FROM investordetails i
            LEFT JOIN coordinator c ON i.coordinator_id = c.coordinator_id
            WHERE i.approval_status = 'pending'
            ORDER BY i.created_at DESC
        `;
        
        const result = await db.query(query);
        
        res.status(200).json({
            success: true,
            count: result.rows.length,
            investors: result.rows
        });
    } catch (error) {
        console.error('❌ Error fetching pending investors:', error);
        res.status(500).json({ 
            success: false,
            message: 'Failed to fetch pending investors.' 
        });
    }
};

/**
 * PUT: Approve an investor - ONLY creates disbursement records
 */
const approveInvestor = async (req, res) => {
    const { investorId } = req.params;
    
    if (!investorId) {
        return res.status(400).json({ 
            success: false,
            message: 'Investor ID is required.' 
        });
    }

    const client = await db.connect();
    try {
        await client.query('BEGIN');
        
        // First, check if investor exists and is pending approval
        const investorResult = await client.query(
            'SELECT * FROM investordetails WHERE id = $1 AND approval_status = $2',
            [investorId, 'pending']
        );
        
        if (investorResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ 
                success: false,
                message: 'Investor not found or already processed.' 
            });
        }
        
        const investor = investorResult.rows[0];
        
        // Check if disbursement schedule already exists for this investor
        const existingSchedule = await client.query(
            'SELECT id FROM disbursement_schedules WHERE investor_id = $1',
            [investorId]
        );
        
        if (existingSchedule.rows.length > 0) {
            console.log(`✅ Disbursement schedule already exists for investor ${investorId}, skipping creation`);
        } else {
            // Debug logging
            console.log('🔍 Investor data for disbursement calculation:', {
                id: investor.id,
                select_plan: investor.select_plan,
                plan_type: investor.plan_type,
                investment_date: investor.investment_date
            });
            
            // Generate disbursement schedule using existing logic
            const disbursementCalculator = require('../utils/disbursementCalculator');
            
            // Get investment amount from select_plan
            const getInvestmentAmount = (selectPlan) => {
                switch (selectPlan) {
                    case '5k': return 5000;
                    case '10k': return 10000;
                    case '50k': return 50000;
                    case '1 lakh': return 100000;
                    case '5 lakh': return 500000;
                    default: return 0;
                }
            };
            
            // Validate required fields before calculating disbursement
            if (!investor.select_plan || !investor.plan_type || !investor.investment_date) {
                await client.query('ROLLBACK');
                return res.status(400).json({
                    success: false,
                    message: 'Missing required investor data for disbursement calculation.',
                    details: {
                        select_plan: investor.select_plan,
                        plan_type: investor.plan_type,
                        investment_date: investor.investment_date
                    }
                });
            }
            
            const disbursementSchedule = disbursementCalculator.calculateDisbursementSchedule({
                investmentAmount: getInvestmentAmount(investor.select_plan),
                selectPlan: investor.select_plan,
                planType: investor.plan_type,
                investmentDate: investor.investment_date
            });
            
            // Insert disbursement schedule
            const scheduleResult = await client.query(
                `INSERT INTO disbursement_schedules (investor_id, investment_amount, plan_type, select_plan, investment_date, total_disbursements)
                 VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
                [
                    investorId,
                    disbursementSchedule.investmentAmount,
                    investor.plan_type,
                    investor.select_plan,
                    investor.investment_date,
                    disbursementSchedule.disbursementDates.length
                ]
            );
            
            const scheduleId = scheduleResult.rows[0].id;
            
            // Insert individual disbursement details
            for (const disbursement of disbursementSchedule.disbursementDates) {
                await client.query(
                    `INSERT INTO disbursement_detail (schedule_id, disbursement_date, disbursement_amount, status)
                     VALUES ($1, $2, $3, 'pending')`,
                    [scheduleId, disbursement.disbursementDate, disbursement.disbursementAmount]
                );
            }
            
            console.log(`✅ Created disbursement schedule for investor ${investorId}`);
        }
        
        // Update investor approval status AFTER creating disbursement records
        await client.query(
            'UPDATE investordetails SET approval_status = $1, approved_by = $2, approved_at = NOW() WHERE id = $3',
            ['approved', req.user.user_id, investorId]
        );
        
        await client.query('COMMIT');
        
        res.status(200).json({
            success: true,
            message: 'Investor approved successfully.',
            investorId: investorId
        });
        
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Error approving investor:', error);
        res.status(500).json({ 
            success: false,
            message: 'Failed to approve investor.' 
        });
    } finally {
        client.release();
    }
};

/**
 * PUT: Reject an investor
 */
const rejectInvestor = async (req, res) => {
    const { investorId } = req.params;
    const { reason } = req.body;
    
    if (!investorId) {
        return res.status(400).json({ 
            success: false,
            message: 'Investor ID is required.' 
        });
    }

    const client = await db.connect();
    try {
        await client.query('BEGIN');
        
        // First, check if investor exists and is pending approval
        const investorResult = await client.query(
            'SELECT * FROM investordetails WHERE id = $1 AND approval_status = $2',
            [investorId, 'pending']
        );
        
        if (investorResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ 
                success: false,
                message: 'Investor not found or already processed.' 
            });
        }
        
        // Update investor approval status to rejected
        await client.query(
            'UPDATE investordetails SET approval_status = $1, approved_by = $2, approved_at = NOW() WHERE id = $3',
            ['rejected', req.user.user_id, investorId]
        );
        
        // Delete any existing disbursement schedule for rejected investor
        const existingSchedule = await client.query(
            'SELECT id FROM disbursement_schedules WHERE investor_id = $1',
            [investorId]
        );
        
        if (existingSchedule.rows.length > 0) {
            // Delete disbursement details first (foreign key constraint)
            await client.query(
                'DELETE FROM disbursement_detail WHERE schedule_id IN (SELECT id FROM disbursement_schedules WHERE investor_id = $1)',
                [investorId]
            );
            
            // Delete disbursement schedule
            await client.query(
                'DELETE FROM disbursement_schedules WHERE investor_id = $1',
                [investorId]
            );
            
            console.log(`🗑️ Deleted disbursement schedule for rejected investor ${investorId}`);
        }
        
        await client.query('COMMIT');
        
        console.log(`❌ Investor ${investorId} rejected by ${req.user.user_id}. Reason: ${reason || 'No reason provided'}`);
        
        res.status(200).json({
            success: true,
            message: 'Investor rejected successfully.',
            investorId: investorId,
            reason: reason || 'Rejected by admin'
        });
        
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Error rejecting investor:', error);
        res.status(500).json({ 
            success: false,
            message: 'Failed to reject investor.' 
        });
    } finally {
        client.release();
    }
};

/**
 * @desc    Toggle vendor product visibility (enable/disable product access for a specific vendor)
 * @route   PUT /api/admin/vendors/:vendorId/product-visibility
 * @access  Private (Admin/Coordinator)
 */
const toggleVendorProductVisibility = async (req, res) => {
    const { vendorId } = req.params;
    const { productVisibility } = req.body;

    if (!vendorId) {
        return res.status(400).json({ 
            success: false,
            message: 'Vendor ID is required.' 
        });
    }

    if (typeof productVisibility !== 'boolean') {
        return res.status(400).json({ 
            success: false,
            message: 'Product visibility must be a boolean value (true or false).' 
        });
    }

    const client = await db.connect();
    try {
        await client.query('BEGIN');

        // Check if vendor exists
        const vendorCheck = await client.query(
            'SELECT id, vendor_name, email, product_visibility FROM vendors WHERE id = $1',
            [vendorId]
        );

        if (vendorCheck.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ 
                success: false,
                message: 'Vendor not found.' 
            });
        }

        const vendor = vendorCheck.rows[0];
        const oldVisibility = vendor.product_visibility;

        // Update product visibility
        const updateResult = await client.query(
            'UPDATE vendors SET product_visibility = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
            [productVisibility, vendorId]
        );

        await client.query('COMMIT');

        const statusText = productVisibility ? 'enabled' : 'disabled';
        console.log(`✅ Product visibility ${statusText} for vendor ${vendorId} (${vendor.vendor_name}) by admin ${req.user.user_id}`);

        res.status(200).json({
            success: true,
            message: `Product visibility has been ${statusText} for vendor ${vendor.vendor_name}.`,
            vendor: {
                id: updateResult.rows[0].id,
                vendor_name: updateResult.rows[0].vendor_name,
                email: updateResult.rows[0].email,
                product_visibility: updateResult.rows[0].product_visibility,
                previous_visibility: oldVisibility
            }
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Error toggling vendor product visibility:', error);
        res.status(500).json({ 
            success: false,
            message: 'Failed to update vendor product visibility.' 
        });
    } finally {
        client.release();
    }
};

/**
 * @desc    Get vendor product visibility status
 * @route   GET /api/admin/vendors/:vendorId/product-visibility
 * @access  Private (Admin/Coordinator)
 */
const getVendorProductVisibility = async (req, res) => {
    const { vendorId } = req.params;

    if (!vendorId) {
        return res.status(400).json({ 
            success: false,
            message: 'Vendor ID is required.' 
        });
    }

    try {
        const result = await db.query(
            'SELECT id, vendor_name, email, product_visibility, created_at, updated_at FROM vendors WHERE id = $1',
            [vendorId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ 
                success: false,
                message: 'Vendor not found.' 
            });
        }

        const vendor = result.rows[0];
        res.status(200).json({
            success: true,
            vendor: {
                id: vendor.id,
                vendor_name: vendor.vendor_name,
                email: vendor.email,
                product_visibility: vendor.product_visibility,
                created_at: vendor.created_at,
                updated_at: vendor.updated_at
            }
        });

    } catch (error) {
        console.error('❌ Error fetching vendor product visibility:', error);
        res.status(500).json({ 
            success: false,
            message: 'Failed to fetch vendor product visibility.' 
        });
    }
};

/**
 * @desc    Get all vendors with their product visibility status
 * @route   GET /api/admin/vendors-visibility
 * @access  Private (Admin/Coordinator)
 */
const getAllVendorsVisibility = async (req, res) => {
    try {
        const query = `
            SELECT 
                v.id, 
                v.vendor_name, 
                v.email, 
                v.product_visibility,
                l.is_approved,
                l.status,
                v.created_at,
                v.updated_at
            FROM vendors v
            JOIN login l ON v.id = l.user_id
            ORDER BY v.created_at DESC
        `;
        
        const result = await db.query(query);
        
        res.status(200).json({
            success: true,
            count: result.rows.length,
            vendors: result.rows
        });

    } catch (error) {
        console.error('❌ Error fetching all vendors visibility:', error);
        res.status(500).json({ 
            success: false,
            message: 'Failed to fetch vendors visibility data.' 
        });
    }
};

/**
 * @desc    Bulk update product visibility for all vendors
 * @route   PUT /api/admin/vendors/bulk-product-visibility
 * @access  Private (Admin/Coordinator)
 */
const bulkUpdateProductVisibility = async (req, res) => {
    const { productVisibility } = req.body;

    if (typeof productVisibility !== 'boolean') {
        return res.status(400).json({ 
            success: false,
            message: 'Product visibility must be a boolean value (true or false).' 
        });
    }

    const client = await db.connect();
    try {
        await client.query('BEGIN');

        // Update all vendors' product visibility
        const updateResult = await client.query(
            'UPDATE vendors SET product_visibility = $1, updated_at = NOW() RETURNING id, vendor_name',
            [productVisibility]
        );

        await client.query('COMMIT');

        const statusText = productVisibility ? 'enabled' : 'disabled';
        const updatedCount = updateResult.rows.length;
        
        console.log(`✅ Product visibility ${statusText} for ${updatedCount} vendors by admin ${req.user.user_id}`);

        res.status(200).json({
            success: true,
            message: `Product visibility has been ${statusText} for all ${updatedCount} vendors.`,
            count: updatedCount,
            status: statusText
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Error bulk updating vendor product visibility:', error);
        res.status(500).json({ 
            success: false,
            message: 'Failed to bulk update vendor product visibility.' 
        });
    } finally {
        client.release();
    }
};

// Update the exports to include the new functions
module.exports = {
    getPendingVendors,
    approveVendor,
    rejectVendor,
    getPendingTrades,
    reviewTrade,
    getAdminDashboardStats,
    getAllVendors,
    getRecentVendors,
    updateVendorCoordinator,
    getPendingWalletTransactions,
    reviewWalletTransaction,
    getWalletsWithPercentages,
    updateUserPercentage,
    getVendorFullProfile,
    getAdminReferralTree,
    getAllWithdrawals,
    getWithdrawalStats,

    getAllVendorsPaginated,
    getAllVendorsFull,
    getVendorCount,
    getVendorsLast8Days,
    getTodayVendors,
    getVendorsLast8DaysPaginated,
    getTodaysVendorsPaginated,
    getWalletStats,
    getPendingInvestors,
    approveInvestor,
    rejectInvestor,
    
    // Vendor Product Visibility Management
    toggleVendorProductVisibility,
    getVendorProductVisibility,
    getAllVendorsVisibility,
    bulkUpdateProductVisibility,
};