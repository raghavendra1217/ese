const db = require('../config/database');
<<<<<<< HEAD
=======
const { deleteFileFromR2 } = require('../utils/cloudflareR2'); // <-- IMPORT THE R2 DELETE UTILITY

// Assume 'db' is your database connection module, imported at the top of your file.

// In backend/api/controllers/adminController.js

// In backend/api/controllers/adminController.js

// In backend/api/controllers/adminController.js

const getPendingWalletTransactions = async (req, res) => {
    const client = await db.connect();
    try {
        const query = `
            SELECT 
                t.trans_id,
                t.user_id,
                t.transaction_type,
                t.amount,
                t.status,
                t.description,
                t.upi_transaction_id,
                t.payment_proof_url,
                t.created_at, -- Corrected column name
                u.vendor_name,
                u.email,
                -- ADDED: Fetch bank details from the vendors table
                u.bank_name,
                u.account_number,
                u.ifsc_code,
                -- ADDED: Fetch current balance from the wallet table
                w.digital_money as current_balance
            FROM transaction t
            JOIN vendors u ON t.user_id = u.id
            -- ADDED: Join with the wallet table
            LEFT JOIN wallet w ON t.user_id = w.id
            WHERE t.status = 'pending' AND (t.transaction_type = 'deposit' OR t.transaction_type = 'withdrawal')
            ORDER BY t.created_at ASC;
        `;
        const { rows } = await client.query(query);
        res.json(rows);
    } catch (error) {
        console.error('Error fetching pending wallet transactions:', error);
        res.status(500).json({ message: 'Server error' });
    } finally {
        client.release();
    }
};

/**
 * @desc    Approves or rejects a pending wallet transaction.
 * @route   POST /api/admin/review-wallet-transaction
 * @access  Private (Admin)
 */
const reviewWalletTransaction = async (req, res) => {
    const { transactionId, decision, comment } = req.body;

    // Validate incoming data
    if (!transactionId || !decision || (decision === 'rejected' && !comment)) {
        return res.status(400).json({ message: 'Missing required fields for review.' });
    }

    const client = await db.connect();
    try {
        await client.query('BEGIN');

        // Lock the transaction row to prevent other admins from reviewing it simultaneously
        const transactionRes = await client.query(
            "SELECT * FROM transaction WHERE trans_id = $1 AND status = 'pending' FOR UPDATE",
            [transactionId]
        );

        if (transactionRes.rows.length === 0) {
            throw new Error('Transaction not found or has already been reviewed.');
        }

        const transaction = transactionRes.rows[0];
        const userId = transaction.user_id;
        const amount = parseFloat(transaction.amount);

        if (decision === 'approved') {
            // If approved, update the wallet balance accordingly
            if (transaction.transaction_type === 'deposit') {
                await client.query(
                    'UPDATE wallet SET digital_money = digital_money + $1 WHERE id = $2',
                    [amount, userId]
                );
            } else if (transaction.transaction_type === 'withdrawal') {
                // Perform a final balance check before deducting funds
                const walletRes = await client.query('SELECT digital_money FROM wallet WHERE id = $1 FOR UPDATE', [userId]);
                if (walletRes.rows[0].digital_money < amount) {
                    throw new Error('User balance is insufficient for this withdrawal.');
                }
                await client.query(
                    'UPDATE wallet SET digital_money = digital_money - $1 WHERE id = $2',
                    [amount, userId]
                );
            }
            // Update transaction status to 'approved'
            await client.query(
                "UPDATE transaction SET status = 'approved', admin_comment = $1 WHERE trans_id = $2",
                [comment || 'Approved by admin', transactionId] // Provide a default approval comment
            );

        } else { // Decision is 'rejected'
            // Update transaction status to 'rejected'
            await client.query(
                "UPDATE transaction SET status = 'rejected', admin_comment = $1 WHERE trans_id = $2",
                [comment, transactionId]
            );
        }

        // If all operations were successful, commit the transaction
        await client.query('COMMIT');
        res.json({ message: `Transaction successfully ${decision}.` });

    } catch (error) {
        // If any error occurred, roll back all changes within the transaction
        await client.query('ROLLBACK');
        console.error('Error reviewing wallet transaction:', error);
        res.status(500).json({ message: error.message || 'Server error during transaction review.' });
    } finally {
        // Always release the database client
        client.release();
    }
};
>>>>>>> d39126c (wallet update)

// =================================================================
// --- VENDOR MANAGEMENT ---
// =================================================================

const getPendingVendors = async (req, res) => {
    try {
        const query = `
            SELECT 
                v.id, v.email, v.vendor_name, v.phone_number, v.aadhar_number, 
                v.pan_card_number, v.employee_count, 
                v.bank_name, v.account_number, v.ifsc_code,
                v.address, v.passport_photo_url, v.payment_screenshot_url, v.transaction_id
            FROM vendors v
            JOIN login l ON v.id = l.user_id
            WHERE l.role = 'vendor' AND l.is_approved = FALSE
            ORDER BY v.created_at ASC;
        `;
        const { rows } = await db.query(query);
        res.status(200).json(rows);
    } catch (error) {
        console.error('❌ Error fetching pending vendors:', error);
        res.status(500).json({ message: 'Failed to fetch pending vendors.' });
    }
};

const approveVendor = async (req, res) => {
    const { vendorId } = req.params;
    if (!vendorId) {
        return res.status(400).json({ message: 'Vendor ID is required.' });
    }
    try {
        const updateQuery = `
            UPDATE login 
            SET is_approved = TRUE, status = 'approved' 
            WHERE user_id = $1 AND role = 'vendor' AND is_approved = FALSE
        `;
        const result = await db.query(updateQuery, [vendorId]);
        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'No pending vendor found with this ID. They may have already been approved.' });
        }
        res.status(200).json({ message: 'Vendor approved successfully!' });
    } catch (error) {
        console.error(`❌ Error approving vendor ${vendorId}:`, error);
        res.status(500).json({ message: 'Failed to approve vendor.' });
    }
};

<<<<<<< HEAD

=======
/**
 * --- UPDATED ---
 * Rejects a vendor and deletes their data from the database AND their files from Cloudflare R2.
 */
>>>>>>> d39126c (wallet update)
const rejectVendor = async (req, res) => {
    const { vendorId } = req.params;
    if (!vendorId) {
        return res.status(400).json({ message: 'Vendor ID is required.' });
    }

    const client = await db.connect();
    try {
        await client.query('BEGIN');

<<<<<<< HEAD
        // Step 1: Delete from the 'login' table.
        // The WHERE clause ensures we only delete a pending vendor.
=======
        // Step 1: Get the URLs of the files to be deleted before deleting the vendor record.
        const vendorRes = await client.query('SELECT passport_photo_url, payment_screenshot_url FROM vendors WHERE id = $1', [vendorId]);
        const vendorData = vendorRes.rows[0];

        // Step 2: Delete from the 'login' table.
>>>>>>> d39126c (wallet update)
        const loginDeleteResult = await client.query(
            `DELETE FROM login WHERE user_id = $1 AND role = 'vendor' AND is_approved = FALSE`,
            [vendorId]
        );
        
<<<<<<< HEAD
        // If no row was deleted from login, it means the vendor wasn't pending or didn't exist.
=======
>>>>>>> d39126c (wallet update)
        if (loginDeleteResult.rowCount === 0) {
            throw new Error('No pending vendor found with this ID to reject. They may have been approved or already rejected.');
        }

<<<<<<< HEAD
        // Step 2: Delete from the 'vendors' table.
        await client.query(`DELETE FROM vendors WHERE id = $1`, [vendorId]);

        await client.query('COMMIT');
        res.status(200).json({ message: 'Vendor rejected and data deleted successfully.' });
=======
        // Step 3: Delete from the 'vendors' table.
        await client.query(`DELETE FROM vendors WHERE id = $1`, [vendorId]);

        // Step 4: After a successful DB transaction, delete the files from R2.
        if (vendorData) {
            if (vendorData.passport_photo_url) {
                await deleteFileFromR2(vendorData.passport_photo_url);
            }
            if (vendorData.payment_screenshot_url) {
                await deleteFileFromR2(vendorData.payment_screenshot_url);
            }
        }

        await client.query('COMMIT');
        res.status(200).json({ message: 'Vendor rejected and all associated data and files have been deleted.' });
>>>>>>> d39126c (wallet update)

    } catch (error) {
        await client.query('ROLLBACK');
        console.error(`❌ Error rejecting vendor ${vendorId}:`, error);
        res.status(500).json({ message: error.message || 'Failed to reject vendor.' });
    } finally {
        client.release();
    }
};
<<<<<<< HEAD

// =================================================================
// --- TRADING MANAGEMENT ---
=======
// In backend/api/controllers/adminController.js

const getAllVendors = async (req, res) => {
    try {
        // This is the corrected query
        const query = `
            SELECT 
                v.id AS vendor_id,      -- Get the 'id' column, but label it 'vendor_id' in the result
                v.vendor_name, 
                v.email, 
                v.phone_number,
                l.status, 
                v.employee_count
            FROM vendors v
            JOIN login l ON v.id = l.user_id
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
// In backend/api/controllers/adminController.js

// --- THIS IS THE NEW FUNCTION FOR THE DASHBOARD ---
const getRecentVendors = async (req, res) => {
    try {
        // This query gets only the 5 newest vendors
        const query = `
            SELECT 
                v.vendor_name,
                v.passport_photo_url
            FROM vendors v
            JOIN login l ON v.id = l.user_id
            WHERE l.role = 'vendor' AND l.is_approved = TRUE
            ORDER BY v.created_at DESC
            LIMIT 5;
        `;
        
        const { rows } = await db.query(query);
        res.status(200).json(rows);

    } catch (error) {
        console.error('❌ Error fetching recent vendors:', error);
        res.status(500).json({ message: 'Failed to fetch recent vendors.' });
    }
};


// =================================================================
// --- TRADING MANAGEMENT (No changes needed) ---
>>>>>>> d39126c (wallet update)
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
<<<<<<< HEAD
            WHERE t.is_approved = 'pending' -- <<< THE FIX IS HERE
=======
            WHERE t.is_approved = 'pending'
>>>>>>> d39126c (wallet update)
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
<<<<<<< HEAD
            // Re-verify stock availability at the moment of approval to prevent overselling
=======
>>>>>>> d39126c (wallet update)
            const stockCheck = await client.query('SELECT available_stock FROM product WHERE product_id = $1', [trade.product_id]);
            if (stockCheck.rows.length === 0 || stockCheck.rows[0].available_stock < trade.no_of_stock_bought) {
                throw new Error('Insufficient stock to approve this trade. The purchase cannot be fulfilled.');
            }
<<<<<<< HEAD

            // 1. Approve the trade
            await client.query(`UPDATE trading SET is_approved = 'approved' WHERE trade_id = $1`, [tradeId]);
            // 2. Deduct the stock
=======
            await client.query(`UPDATE trading SET is_approved = 'approved' WHERE trade_id = $1`, [tradeId]);
>>>>>>> d39126c (wallet update)
            await client.query(`UPDATE product SET available_stock = available_stock - $1 WHERE product_id = $2`, [trade.no_of_stock_bought, trade.product_id]);
            
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
<<<<<<< HEAD
// --- DASHBOARD STATS ---
// =================================================================

const getAdminDashboardStats = async (req, res) => {
    try {
        const vendorQuery = "SELECT COUNT(*) FROM login WHERE role = 'vendor' AND is_approved = FALSE";
        const tradeQuery = "SELECT COUNT(*) FROM trading WHERE is_approved = 'pending'"; // No need for payment_url check with new architecture

        const [vendorResult, tradeResult] = await Promise.all([
            db.query(vendorQuery),
            db.query(tradeQuery)
=======
// --- DASHBOARD STATS (No changes needed) ---
// =================================================================


// --- UPDATED DASHBOARD STATS FUNCTION ---
// In backend/api/controllers/adminController.js

const getAdminDashboardStats = async (req, res) => {
    const client = await db.connect(); // Get a client from the pool
    try {
        const vendorQuery = "SELECT COUNT(*) FROM login WHERE role = 'vendor' AND is_approved = FALSE";
        const tradeQuery = "SELECT COUNT(*) FROM trading WHERE is_approved = 'pending'";
        const walletQuery = "SELECT COUNT(*) FROM transaction WHERE status = 'pending' AND (transaction_type = 'deposit' OR transaction_type = 'withdrawal')";

        // Use the same client for all concurrent queries
        const [vendorResult, tradeResult, walletResult] = await Promise.all([
            client.query(vendorQuery),
            client.query(tradeQuery),
            client.query(walletQuery)
>>>>>>> d39126c (wallet update)
        ]);
        
        const stats = {
            pendingVendorApprovals: parseInt(vendorResult.rows[0].count, 10),
            pendingTradeApprovals: parseInt(tradeResult.rows[0].count, 10),
<<<<<<< HEAD
        };
=======
            pendingWalletApprovals: parseInt(walletResult.rows[0].count, 10),
        };

>>>>>>> d39126c (wallet update)
        res.status(200).json(stats);
    } catch (error) {
        console.error('❌ Error fetching admin dashboard stats:', error);
        res.status(500).json({ message: 'Failed to fetch admin statistics.' });
<<<<<<< HEAD
    }
};

// --- EXPORT ALL CONTROLLER FUNCTIONS ---
=======
    } finally {
        client.release(); // Release the client
    }
};


// --- UPDATED MODULE EXPORTS ---
>>>>>>> d39126c (wallet update)
module.exports = {
    getPendingVendors,
    approveVendor,
    rejectVendor,
    getPendingTrades,
    reviewTrade,
<<<<<<< HEAD
    getAdminDashboardStats,
=======
    getAdminDashboardStats, // The function updated above
    getAllVendors,
    getRecentVendors,
    getPendingWalletTransactions, // New function for the approvals page
    reviewWalletTransaction,      // New function to handle approve/reject actions
>>>>>>> d39126c (wallet update)
};