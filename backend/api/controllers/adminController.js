const db = require('../config/database');

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


const rejectVendor = async (req, res) => {
    const { vendorId } = req.params;
    if (!vendorId) {
        return res.status(400).json({ message: 'Vendor ID is required.' });
    }

    const client = await db.connect();
    try {
        await client.query('BEGIN');

        // Step 1: Delete from the 'login' table.
        // The WHERE clause ensures we only delete a pending vendor.
        const loginDeleteResult = await client.query(
            `DELETE FROM login WHERE user_id = $1 AND role = 'vendor' AND is_approved = FALSE`,
            [vendorId]
        );
        
        // If no row was deleted from login, it means the vendor wasn't pending or didn't exist.
        if (loginDeleteResult.rowCount === 0) {
            throw new Error('No pending vendor found with this ID to reject. They may have been approved or already rejected.');
        }

        // Step 2: Delete from the 'vendors' table.
        await client.query(`DELETE FROM vendors WHERE id = $1`, [vendorId]);

        await client.query('COMMIT');
        res.status(200).json({ message: 'Vendor rejected and data deleted successfully.' });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error(`❌ Error rejecting vendor ${vendorId}:`, error);
        res.status(500).json({ message: error.message || 'Failed to reject vendor.' });
    } finally {
        client.release();
    }
};

// =================================================================
// --- TRADING MANAGEMENT ---
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
            WHERE t.is_approved = 'pending' -- <<< THE FIX IS HERE
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
            // Re-verify stock availability at the moment of approval to prevent overselling
            const stockCheck = await client.query('SELECT available_stock FROM product WHERE product_id = $1', [trade.product_id]);
            if (stockCheck.rows.length === 0 || stockCheck.rows[0].available_stock < trade.no_of_stock_bought) {
                throw new Error('Insufficient stock to approve this trade. The purchase cannot be fulfilled.');
            }

            // 1. Approve the trade
            await client.query(`UPDATE trading SET is_approved = 'approved' WHERE trade_id = $1`, [tradeId]);
            // 2. Deduct the stock
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
// =================================================================

const getAdminDashboardStats = async (req, res) => {
    try {
        const vendorQuery = "SELECT COUNT(*) FROM login WHERE role = 'vendor' AND is_approved = FALSE";
        const tradeQuery = "SELECT COUNT(*) FROM trading WHERE is_approved = 'pending'"; // No need for payment_url check with new architecture

        const [vendorResult, tradeResult] = await Promise.all([
            db.query(vendorQuery),
            db.query(tradeQuery)
        ]);
        
        const stats = {
            pendingVendorApprovals: parseInt(vendorResult.rows[0].count, 10),
            pendingTradeApprovals: parseInt(tradeResult.rows[0].count, 10),
        };
        res.status(200).json(stats);
    } catch (error) {
        console.error('❌ Error fetching admin dashboard stats:', error);
        res.status(500).json({ message: 'Failed to fetch admin statistics.' });
    }
};

// --- EXPORT ALL CONTROLLER FUNCTIONS ---
module.exports = {
    getPendingVendors,
    approveVendor,
    rejectVendor,
    getPendingTrades,
    reviewTrade,
    getAdminDashboardStats,
};