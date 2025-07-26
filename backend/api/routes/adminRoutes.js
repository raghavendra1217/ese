const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');

// =======================================================
// --- VENDOR MANAGEMENT ROUTES ---
// =======================================================
router.get('/pending-vendors', adminController.getPendingVendors);
router.put('/approve-vendor/:vendorId', adminController.approveVendor);


// =======================================================
// --- DASHBOARD STATS ROUTE ---
// =======================================================
router.get('/stats/dashboard', adminController.getAdminDashboardStats);



// =======================================================
// --- TRADING APPROVAL ROUTES (NEW) ---
// =======================================================

// This route gets the list of trades waiting for approval.
// It will fix the 404 Not Found error.
router.get('/pending-trades', adminController.getPendingTrades);

// This route handles the action of approving a specific trade.
router.put('/approve-trade/:tradeId', adminController.approveTrade);


module.exports = router;