// backend/api/controllers/adminController.js

const db = require('../config/database');
const { execFile } = require('child_process');
const path = require('path');
// --- ADDED: New functions from incoming change ---
// These are new features and do not conflict with your existing code.

const getRecentTransactions = async (req, res) => {
    try {
        const query = `
            SELECT 
                trans_id, 
                user_id, 
                transaction_type, 
                balance_after_transaction,
                amount,
                created_at 
            FROM 
                transaction 
            ORDER BY 
                created_at DESC 
            LIMIT 10;
        `;
        const { rows } = await db.query(query);
        res.status(200).json(rows);
    } catch (error) {
        console.error('❌ Error fetching recent transactions:', error);
        res.status(500).json({ message: 'Failed to fetch recent transactions.' });
    }
};


const getPendingWalletTransactions = async (req, res) => {
    const client = await db.connect();
    try {
        const query = `
            SELECT 
                t.trans_id, t.user_id, t.transaction_type, t.amount, t.status, t.description,
                t.upi_transaction_id, t.payment_proof_url, t.created_at, u.vendor_name, u.email,
                u.bank_name, u.account_number, u.ifsc_code, w.digital_money as current_balance
            FROM transaction t
            JOIN vendors u ON t.user_id = u.id
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
            if (transaction.transaction_type === 'deposit') {
                await client.query('UPDATE wallet SET digital_money = digital_money + $1 WHERE id = $2', [amount, userId]);
            } else if (transaction.transaction_type === 'withdrawal') {
                const walletRes = await client.query('SELECT digital_money FROM wallet WHERE id = $1 FOR UPDATE', [userId]);
                if (walletRes.rows[0].digital_money < amount) {
                    throw new Error('User balance is insufficient for this withdrawal.');
                }
                await client.query('UPDATE wallet SET digital_money = digital_money - $1 WHERE id = $2', [amount, userId]);
            }
            await client.query("UPDATE transaction SET status = 'approved', admin_comment = $1 WHERE trans_id = $2", [comment || 'Approved by admin', transactionId]);
        } else { // Decision is 'rejected'
            await client.query("UPDATE transaction SET status = 'rejected', admin_comment = $1 WHERE trans_id = $2", [comment, transactionId]);
        }
        await client.query('COMMIT');
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
            SELECT v.id AS vendor_id, v.vendor_name, v.email, v.phone_number,
                   l.status, v.employee_count, l.role -- <--- THIS IS THE FIX
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
    if (!vendorId) return res.status(400).json({ message: 'Vendor ID is required.' });
    try {
        const updateQuery = `UPDATE login SET is_approved = TRUE, status = 'approved' WHERE user_id = $1 AND role = 'vendor' AND is_approved = FALSE`;
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

// --- RESOLVED: Kept your existing rejectVendor function ---
// This preserves your feature of deleting from the local database without cloud logic.

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

        // ✅ Send rejection email
        const pythonPath = path.join(__dirname, '..', 'utils', 'sendRejectionEmail.py');
        execFile('python3', [pythonPath, email, vendor_name], (error, stdout, stderr) => {
            if (error) {
                console.error(`❌ Failed to send rejection email: ${error.message}`);
            } else {
                console.log(`📧 Rejection email sent: ${stdout}`);
            }
        });

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
// --- DASHBOARD STATS ---
// --- RESOLVED: Merged stats queries from both versions ---
// =================================================================
const getAdminDashboardStats = async (req, res) => {
    try {
        const vendorQuery = "SELECT COUNT(*) FROM login WHERE role = 'vendor' AND is_approved = FALSE";
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
    try {
        // Join wallet with vendors to get names, and only select users who have a wallet.
        // The subquery gets the most recent percentage for each user.
        const query = `
            SELECT
                w.id AS user_id,
                v.vendor_name AS name,
                (
                    SELECT p ->> 'percentage'
                    FROM jsonb_array_elements(w.percentage) AS p
                    ORDER BY (p ->> 'updated_date')::timestamptz DESC
                    LIMIT 1
                ) AS current_percentage
            FROM wallet w
            JOIN vendors v ON w.id = v.id
            ORDER BY v.vendor_name;
        `;
        
        const result = await db.query(query);
        res.status(200).json(result.rows);

    } catch (error) {
        console.error('❌ Error fetching wallets with percentages:', error);
        res.status(500).json({ message: 'Server error while fetching wallet data.' });
    }
};

const updateUserPercentage = async (req, res) => {
    const { userId, newPercentage } = req.body;

    if (!userId || newPercentage === undefined) {
        return res.status(400).json({ message: 'User ID and a new percentage are required.' });
    }

    const percentageValue = parseFloat(newPercentage);
    if (isNaN(percentageValue) || percentageValue < 0) {
        return res.status(400).json({ message: 'A valid, non-negative percentage is required.' });
    }

    try {
        // Create the new JSON object to append
        const newPercentageEntry = {
            percentage: percentageValue,
            updated_date: new Date().toISOString()
        };

        // Append the new entry to the 'percentage' JSONB array in the wallet table
        // COALESCE ensures that if the 'percentage' column is NULL, it's treated as an empty array.
        const result = await db.query(
            `UPDATE wallet 
             SET percentage = COALESCE(percentage, '[]'::jsonb) || $1::jsonb 
             WHERE id = $2`,
            [JSON.stringify(newPercentageEntry), userId]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'User or wallet not found.' });
        }

        res.status(200).json({ message: `Successfully updated percentage for user ${userId}.` });

    } catch (error) {
        console.error(`❌ Error updating percentage for user ${userId}:`, error);
        res.status(500).json({ message: 'Server error while updating percentage.' });
    }
};



// --- RESOLVED: Merged all exports from both versions ---
module.exports = {
    getPendingVendors,
    approveVendor,
    rejectVendor,
    getPendingTrades,
    reviewTrade,
    getAdminDashboardStats,
    // Added new functions from incoming change
    getAllVendors,
    getRecentVendors,
    getPendingWalletTransactions,
    reviewWalletTransaction,
    getRecentTransactions,
    getWalletsWithPercentages,
    updateUserPercentage,
};