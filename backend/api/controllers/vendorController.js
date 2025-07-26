// backend/api/controllers/vendorController.js

const db = require('../config/database');

/**
 * Fetches aggregated statistics for the vendor dashboard.
 * This single endpoint gathers all necessary data to populate the vendor's main view.
 */
exports.getVendorDashboardStats = async (req, res) => {
    // req.user is attached by the 'protect' middleware
    const vendorId = req.user.user_id;

    if (!vendorId) {
        return res.status(401).json({ message: 'Not authorized, vendor ID missing.' });
    }

    try {
        // We will run all database queries in parallel for maximum efficiency
        const [
            resumeStatsResult,
            productStatsResult,
            tradingStatsResult
        ] = await Promise.all([
            // Query 1: Get resume-related stats for this specific vendor
            db.query(`
                SELECT 
                    COUNT(*) FILTER (WHERE task_status = 'assigned') as "assignedResumes",
                    COUNT(*) FILTER (WHERE task_status = 'completed') as "completedResumes"
                FROM resume WHERE vendor_id = $1
            `, [vendorId]),

            // --- THIS IS THE FIX ---
            // Query 2: Get the COUNT of product types that have stock available.
            db.query(`
                SELECT COUNT(*) as "availableProductCount" 
                FROM product WHERE available_stock > 0
            `),

            // Query 3: Get trading-related stats for this specific vendor.
            db.query(`
                SELECT 
                    COUNT(*) FILTER (WHERE is_approved = TRUE) as "approvedPurchasesCount",
                    COALESCE(SUM(total_amount_paid) FILTER (WHERE is_approved = TRUE), 0) as "approvedPurchasesValue",
                    COUNT(*) FILTER (WHERE is_approved = FALSE AND payment_url IS NOT NULL) as "pendingPurchasesCount"
                FROM trading WHERE vendor_id = $1
            `, [vendorId])
        ]);

        // Extract the single row of results from each query
        const resumeStats = resumeStatsResult.rows[0];
        const productStats = productStatsResult.rows[0];
        const tradingStats = tradingStatsResult.rows[0];

        // Assemble the final, clean stats object to send to the frontend
        const stats = {
            // Stats from the 'resume' table
            assignedResumes: parseInt(resumeStats.assignedResumes, 10),
            completedResumes: parseInt(resumeStats.completedResumes, 10),

            // --- THIS IS THE FIX ---
            // We now use the 'availableProductCount' from our corrected query.
            availableProducts: parseInt(productStats.availableProductCount, 10),

            // Corrected keys for trading stats to be more descriptive
            purchasedProducts: parseInt(tradingStats.approvedPurchasesCount, 10),
            purchasedValue: parseFloat(tradingStats.approvedPurchasesValue),
            pendingTradeApprovals: parseInt(tradingStats.pendingPurchasesCount, 10),

            // Placeholder stats
            pendingEmployeeApprovals: 0,
            availableVacancies: 10,
            employeesOnHold: 8,
            pendingPayOuts: parseInt(resumeStats.completedResumes, 10), // Example logic
        };

        res.status(200).json(stats);

    } catch (error) {
        console.error(`❌ Error fetching dashboard stats for vendor ${vendorId}:`, error);
        res.status(500).json({ message: 'An internal server error occurred while fetching your dashboard statistics.' });
    }
};

// ... any other functions in your vendorController.js file ...