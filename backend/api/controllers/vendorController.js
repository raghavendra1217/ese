// backend/api/controllers/vendorController.js

const db = require('../config/database');

exports.getVendorDashboardStats = async (req, res) => {
    // req.user is attached by the 'protect' middleware
    const vendorId = req.user.user_id; 

    if (!vendorId) {
        return res.status(401).json({ message: 'Not authorized, vendor ID missing.' });
    }

    try {
        const [
            resumeStatsResult,
            productStatsResult,
            tradingStatsResult
        ] = await Promise.all([
            // Query 1: Get resume stats (this is correct)
            db.query(`
                SELECT 
                    COUNT(*) FILTER (WHERE task_status = 'assigned') as "assignedResumes",
                    COUNT(*) FILTER (WHERE task_status = 'completed') as "completedResumes"
                FROM resume WHERE vendor_id = $1
            `, [vendorId]),
            
            // --- THE FIX IS HERE ---
            // Query 2: Get the SUM of all available stock, not just the count of products.
            // We use COALESCE to ensure that if there are no products, we get 0 instead of NULL.
            db.query(`
                SELECT COALESCE(SUM(available_stock), 0) as total_stock 
                FROM product
            `),

            // Query 3: Get trading stats (this is correct)
            db.query(`
                SELECT 
                    COUNT(*) as "purchasedProducts",
                    COALESCE(SUM(total_amount_paid), 0) as "purchasedValue",
                    COUNT(*) FILTER (WHERE is_approved = TRUE) as "pendingPayOuts"
                FROM trading WHERE vendor_id = $1
            `, [vendorId])
        ]);

        // Combine all results into a single stats object
        const stats = {
            assignedResumes: parseInt(resumeStatsResult.rows[0].assignedResumes, 10),
            completedResumes: parseInt(resumeStatsResult.rows[0].completedResumes, 10),
            
            // --- AND THE FIX IS HERE ---
            // We now read the 'total_stock' value from our corrected query result.
            availableProducts: parseInt(productStatsResult.rows[0].total_stock, 10),
            
            purchasedProducts: parseInt(tradingStatsResult.rows[0].purchasedProducts, 10),
            purchasedValue: parseFloat(tradingStatsResult.rows[0].purchasedValue),
            pendingPayOuts: parseInt(tradingStatsResult.rows[0].pendingPayOuts, 10),
            
            // Placeholders remain the same
            pendingEmployeeApprovals: 0,
            availableVacancies: 10,
            employeesOnHold: 8,
        };

        res.status(200).json(stats);

    } catch (error) {
        console.error('❌ Error fetching vendor dashboard stats:', error);
        res.status(500).json({ message: 'Failed to fetch vendor statistics.' });
    }
};

// ... any other functions in your vendorController.js file ...