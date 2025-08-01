// backend/api/routes/adminRoutes.js

const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/authMiddleware');

// =======================================================
// --- VENDOR MANAGEMENT ROUTES ---
// (This section merges all vendor-related routes from both versions)
// =======================================================
router.get('/vendors/recent', protect, authorize('admin'), adminController.getRecentVendors);
router.get('/vendors/all', protect, authorize('admin'), adminController.getAllVendors);
router.get('/pending-vendors', protect, authorize('admin'), adminController.getPendingVendors);
router.put('/approve-vendor/:vendorId', protect, authorize('admin'), adminController.approveVendor);
router.put('/reject-vendor/:vendorId', protect, authorize('admin'), adminController.rejectVendor);
router.get('/transactions/recent', protect, authorize('admin'), adminController.getRecentTransactions);


// =======================================================
// --- DASHBOARD STATS ROUTE ---
// (This route was present in both versions)
// =======================================================
router.get('/stats/dashboard', protect, authorize('admin'), adminController.getAdminDashboardStats);


// =======================================================
// --- TRADING APPROVAL ROUTES ---
// (This section includes your existing routes)
// =======================================================
router.get('/pending-trades', protect, authorize('admin'), adminController.getPendingTrades);
// This commented-out route from your version is preserved.
// router.put('/approve-trade/:tradeId', protect, authorize('admin'), adminController.approveTrade);
router.post('/trades/review', protect, authorize('admin'), adminController.reviewTrade);


// =======================================================
// --- WALLET TRANSACTION ROUTES ---
// (This is a new feature added from the incoming change)
// =======================================================
router.get('/pending-wallet-transactions', protect, authorize('admin'), adminController.getPendingWalletTransactions);
router.post('/review-wallet-transaction', protect, authorize('admin'), adminController.reviewWalletTransaction);

router.get('/wallets-with-percentages', protect, authorize('admin'), adminController.getWalletsWithPercentages);

// POST /api/admin/update-percentage - Updates the percentage for a specific user
router.post('/update-percentage', protect, authorize('admin'), adminController.updateUserPercentage)

module.exports = router;