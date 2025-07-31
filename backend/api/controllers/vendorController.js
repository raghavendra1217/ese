// backend/api/controllers/vendorController.js

const db = require('../config/database');

// --- RESOLVED: Kept your existing version of the function ---
// This preserves your specific SQL logic for calculating pending purchases.
exports.getVendorDashboardStats = async (req, res) => {
    const vendorId = req.user.user_id;

    if (!vendorId) {
        return res.status(401).json({ message: 'Not authorized, vendor ID missing.' });
    }

    try {
        const [
            resumeStatsResult,
            productStatsResult,
            tradingStatsResult,
            walletResult
        ] = await Promise.all([
            // Query 1: Get resume-related stats
            db.query(`
                SELECT 
                    COUNT(*) FILTER (WHERE task_status = 'assigned') as "assignedResumes",
                    COUNT(*) FILTER (WHERE task_status = 'completed') as "completedResumes"
                FROM resume WHERE vendor_id = $1
            `, [vendorId]),

            // Query 2: Get the count of available products
            db.query(`
                SELECT COUNT(*) as "availableProductCount" 
                FROM product WHERE available_stock > 0
            `),

            // Query 3: Get trading-related stats with your specific logic
            db.query(`
                SELECT 
        
                    COUNT(*) FILTER (WHERE LOWER(is_approved) = 'approved') as "approvedPurchasesCount",
                    COALESCE(SUM(total_amount_paid) FILTER (WHERE LOWER(is_approved) = 'approved'), 0) as "approvedPurchasesValue",


                    COUNT(*) FILTER (WHERE is_approved = 'pending' AND payment_url IS NOT NULL) as "pendingPurchasesCount"
                FROM trading WHERE vendor_id = $1
            `, [vendorId]),

            // Query 4: Get the user's digital money balance
            db.query(
                'SELECT digital_money FROM wallet WHERE id = $1', 
                [vendorId]
            )
        ]);

        const resumeStats = resumeStatsResult.rows[0];
        const productStats = productStatsResult.rows[0];
        const tradingStats = tradingStatsResult.rows[0];
        const walletBalance = walletResult.rows.length > 0 ? walletResult.rows[0].digital_money : 0;

        // Assemble the final stats object using your structure
        const stats = {
            assignedResumes: parseInt(resumeStats.assignedResumes, 10),
            completedResumes: parseInt(resumeStats.completedResumes, 10),
            availableProducts: parseInt(productStats.availableProductCount, 10),
            digitalMoney: parseFloat(walletBalance),
            purchasedProducts: parseInt(tradingStats.approvedPurchasesCount, 10),
            purchasedValue: parseFloat(tradingStats.approvedPurchasesValue),
            pendingTradeApprovals: parseInt(tradingStats.pendingPurchasesCount, 10),
            pendingEmployeeApprovals: 0,
            availableVacancies: 10,
            employeesOnHold: 8,
            pendingPayOuts: parseInt(resumeStats.completedResumes, 10),
        };

        res.status(200).json(stats);

    } catch (error) {
        console.error(`❌ Error fetching dashboard stats for vendor ${vendorId}:`, error);
        res.status(500).json({ message: 'An internal server error occurred while fetching your dashboard statistics.' });
    }
};