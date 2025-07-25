// backend/api/controllers/adminController.js

const db = require('../config/database');

/**
 * Fetches all vendors who are pending approval.
 * We know they have paid because an entry in the `login` table is only created after payment submission.
 */
exports.getPendingVendors = async (req, res) => {
    try {
        // THE FIX: Removed the non-existent 'v.is_payment_complete = TRUE' from the WHERE clause.
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
 * Approves a specific vendor. (This function is correct and needs no changes)
 */
exports.approveVendor = async (req, res) => {
    const { vendorId } = req.params;

    if (!vendorId) {
        return res.status(400).json({ message: 'Vendor ID is required.' });
    }
    try {
        const updateQuery = 'UPDATE login SET is_approved = TRUE WHERE user_id = $1 AND role = \'vendor\'';
        const result = await db.query(updateQuery, [vendorId]);
        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'No pending vendor found with this ID.' });
        }
        res.status(200).json({ message: 'Vendor approved successfully!' });
    } catch (error) {
        console.error(`❌ Error approving vendor ${vendorId}:`, error);
        res.status(500).json({ message: 'Failed to approve vendor.' });
    }
};


exports.getAdminDashboardStats = async (req, res) => {
    try {
        const query = "SELECT COUNT(*) FROM login WHERE role = 'vendor' AND is_approved = FALSE";
        const { rows } = await db.query(query);

        const stats = {
            // The key here MUST match what the frontend expects
            pendingVendorApprovals: parseInt(rows[0].count, 10),
        };

        res.status(200).json(stats);
    } catch (error) {
        console.error('❌ Error fetching admin dashboard stats:', error);
        res.status(500).json({ message: 'Failed to fetch admin statistics.' });
    }
};