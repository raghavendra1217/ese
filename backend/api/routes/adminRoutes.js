const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/authMiddleware');

// =======================================================
// --- VENDOR MANAGEMENT ROUTES ---
// =======================================================
router.get('/pending-vendors', protect, authorize('admin'), adminController.getPendingVendors);
router.put('/approve-vendor/:vendorId', protect, authorize('admin'), adminController.approveVendor);


// =======================================================
// --- DASHBOARD STATS ROUTE ---
// =======================================================
router.get('/stats/dashboard', protect, authorize('admin'), adminController.getAdminDashboardStats);


router.delete('/reject-vendor/:vendorId', protect,authorize('admin') , adminController.rejectVendor);


// =======================================================
// --- TRADING APPROVAL ROUTES (NEW) ---
// =======================================================

// This route gets the list of trades waiting for approval.
// It will fix the 404 Not Found error.
router.get('/pending-trades', protect, authorize('admin'), adminController.getPendingTrades);

// This route handles the action of approving a specific trade.
// router.put('/approve-trade/:tradeId', protect, authorize('admin'), adminController.approveTrade);

// New route for approving/rejecting trades
router.post('/trades/review', protect ,authorize('admin'), adminController.reviewTrade);


module.exports = router;