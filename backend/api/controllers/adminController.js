const db = require('../config/database');

// =================================================================
// --- VENDOR MANAGEMENT ---
// =================================================================

/**
 * Fetches all vendors who are pending approval.
 * A vendor is considered pending if their entry in the 'login' table has is_approved = FALSE.
 */
exports.getPendingVendors = async (req, res) => {
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

/**
 * Approves a specific vendor, allowing them to proceed with setting their password and logging in.
 */
exports.approveVendor = async (req, res) => {
    const { vendorId } = req.params;

    if (!vendorId) {
        return res.status(400).json({ message: 'Vendor ID is required.' });
    }
    try {
        // Update the 'is_approved' flag and set a clear 'status' for the user flow.
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


// =================================================================
// --- TRADING MANAGEMENT ---
// =================================================================

/**
 * Fetches all trades that are pending admin approval.
 * A trade is pending if payment proof has been submitted but it is not yet approved.
 */
exports.getPendingTrades = async (req, res) => {
    try {
        // The JOINs are used to fetch human-readable names for the frontend UI.
        const query = `
            SELECT 
                t.trade_id,
                t.no_of_stock_bought,
                t.total_amount_paid,
                t.transaction_id,
                t.payment_url,
                t.date,
                p.paper_type,  -- Using paper_type as the product description
                v.vendor_name
            FROM trading t
            JOIN product p ON t.product_id = p.product_id
            JOIN vendors v ON t.vendor_id = v.id
            WHERE t.is_approved = FALSE AND t.payment_url IS NOT NULL
            ORDER BY t.date ASC;
        `;
        const { rows } = await db.query(query);
        res.status(200).json(rows);
    } catch (error) {
        console.error('❌ Error fetching pending trades:', error);
        res.status(500).json({ message: 'Failed to fetch pending trades.' });
    }
};

/**
 * Approves a trade within a database transaction, which also decrements the product's stock.
 * This operation is atomic: both actions must succeed, or both will be rolled back.
 */
exports.approveTrade = async (req, res) => {
    const { tradeId } = req.params;
    const client = await db.connect(); // Get a client from the pool for the transaction

    try {
        await client.query('BEGIN'); // Start the transaction

        // Step 1: Get trade details and lock the row to prevent concurrent modifications.
        const tradeRes = await client.query(
            'SELECT product_id, no_of_stock_bought, is_approved FROM trading WHERE trade_id = $1 FOR UPDATE',
            [tradeId]
        );

        if (tradeRes.rows.length === 0) {
            throw new Error('Trade not found.');
        }

        const trade = tradeRes.rows[0];
        if (trade.is_approved) {
            return res.status(409).json({ message: 'This trade has already been approved.' });
        }

        // Step 2: Decrement the stock in the product table.
        // The WHERE clause ensures we don't oversell and go into negative stock.
        const stockUpdateResult = await client.query(
            'UPDATE product SET available_stock = available_stock - $1 WHERE product_id = $2 AND available_stock >= $1',
            [trade.no_of_stock_bought, trade.product_id]
        );
        
        if (stockUpdateResult.rowCount === 0) {
            throw new Error('Insufficient stock to approve this trade. The purchase cannot be fulfilled.');
        }

        // Step 3: Mark the trade as approved.
        await client.query('UPDATE trading SET is_approved = TRUE WHERE trade_id = $1', [tradeId]);

        await client.query('COMMIT'); // Commit all changes if everything was successful
        res.status(200).json({ message: 'Trade approved and stock updated successfully!' });

    } catch (error) {
        await client.query('ROLLBACK'); // Undo all changes if any error occurred
        console.error(`❌ Error approving trade ${tradeId}:`, error);
        // Send the specific error message (e.g., "Insufficient stock") to the frontend.
        res.status(500).json({ message: error.message || 'Failed to approve trade.' });
    } finally {
        client.release(); // IMPORTANT: Always release the client back to the pool
    }
};


// =================================================================
// --- DASHBOARD STATS ---
// =================================================================

/**
 * Fetches all necessary stats for the admin dashboard efficiently using parallel queries.
 */
exports.getAdminDashboardStats = async (req, res) => {
    try {
        const vendorQuery = "SELECT COUNT(*) FROM login WHERE role = 'vendor' AND is_approved = FALSE";
        const tradeQuery = "SELECT COUNT(*) FROM trading WHERE is_approved = FALSE AND payment_url IS NOT NULL";

        // Run queries in parallel for better performance
        const [vendorResult, tradeResult] = await Promise.all([
            db.query(vendorQuery),
            db.query(tradeQuery)
        ]);
        
        const stats = {
            pendingVendorApprovals: parseInt(vendorResult.rows[0].count, 10),
            pendingTradeApprovals: parseInt(tradeResult.rows[0].count, 10), // This key is used by the frontend dashboard
        };

        res.status(200).json(stats);
    } catch (error) {
        console.error('❌ Error fetching admin dashboard stats:', error);
        res.status(500).json({ message: 'Failed to fetch admin statistics.' });
    }
};