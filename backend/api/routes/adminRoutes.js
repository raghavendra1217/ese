// backend/api/routes/adminRoutes.js

const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/authMiddleware');

// =======================================================
// --- VENDOR MANAGEMENT ROUTES ---
// (This section merges all vendor-related routes from both versions)

// =======================================================
router.get('/vendors/recent', protect, authorize('admin', 'coordinator'), adminController.getRecentVendors);
router.get('/vendors/all', protect, authorize('admin', 'coordinator'), adminController.getAllVendors);
router.get('/pending-vendors', protect, authorize('admin', 'coordinator'), adminController.getPendingVendors);
router.put('/approve-vendor/:vendorId', protect, authorize('admin', 'coordinator'), adminController.approveVendor);
router.put('/reject-vendor/:vendorId', protect, authorize('admin', 'coordinator'), adminController.rejectVendor);
router.put('/update-vendor-coordinator/:vendorId', protect, authorize('admin', 'coordinator'), adminController.updateVendorCoordinator);
router.post('/review-wallet-transaction', protect, authorize('admin', 'coordinator'), adminController.reviewWalletTransaction);
router.get('/vendor-profile/:vendorId', protect, authorize('admin', 'coordinator'), adminController.getVendorFullProfile);

router.get('/vendors/all', protect, authorize('admin', 'coordinator'), adminController.getAllVendorsFull);

router.get('/vendors/paginated', protect,authorize('admin', 'coordinator'),adminController.getAllVendorsPaginated);

// =======================================================
// --- VENDOR COUNT ROUTES ---
// =======================================================
router.get('/vendors/count', protect, authorize('admin', 'coordinator'), adminController.getVendorCount);
router.get('/vendors/last8days', protect, authorize('admin', 'coordinator'), adminController.getVendorsLast8Days);
router.get('/vendors/today', protect, authorize('admin', 'coordinator'), adminController.getTodayVendors);
router.get('/vendors/last8days/paginated', protect, authorize('admin', 'coordinator'), adminController.getVendorsLast8DaysPaginated);
router.get('/vendors/today/paginated', protect, authorize('admin', 'coordinator'), adminController.getTodaysVendorsPaginated);

// =======================================================
// --- DASHBOARD STATS ROUTES ---
// (This route was present in both versions)
// =======================================================
router.get('/stats/dashboard', protect, authorize('admin', 'coordinator'), adminController.getAdminDashboardStats);
router.get('/stats/wallet', protect, authorize('admin', 'coordinator'), adminController.getWalletStats);
router.get('/stats/daily-trading', protect, authorize('admin', 'coordinator'), adminController.getDailyTradingStats);


// =======================================================
// --- TRADING APPROVAL ROUTES ---
// (This section includes your existing routes)
// =======================================================
router.get('/pending-trades', protect, authorize('admin', 'coordinator'), adminController.getPendingTrades);
// This commented-out route from your version is preserved.
// router.put('/approve-trade/:tradeId', protect, authorize('admin'), adminController.approveTrade);
router.post('/trades/review', protect, authorize('admin', 'coordinator'), adminController.reviewTrade);


// =======================================================
// --- WALLET TRANSACTION ROUTES ---
// (This is a new feature added from the incoming change)
// =======================================================
router.get('/pending-wallet-transactions', protect, authorize('admin', 'coordinator'), adminController.getPendingWalletTransactions);
router.post('/review-wallet-transaction', protect, authorize('admin', 'coordinator'), adminController.reviewWalletTransaction);
router.get('/withdrawals', protect, authorize('admin', 'coordinator'), adminController.getAllWithdrawals);
router.get('/withdrawal-stats', protect, authorize('admin', 'coordinator'), adminController.getWithdrawalStats);

// =======================================================
// --- PRODUCT REQUEST MANAGEMENT ROUTES ---
// =======================================================
router.get('/pending-product-requests', protect, authorize('admin', 'coordinator'), adminController.getPendingProductRequests);
router.post('/review-product-request', protect, authorize('admin', 'coordinator'), adminController.reviewProductRequest);
router.get('/product-requests', protect, authorize('admin', 'coordinator'), adminController.getAllProductRequests);
router.get('/product-request-stats', protect, authorize('admin', 'coordinator'), adminController.getProductRequestStats);

router.get('/wallets-with-percentages', protect, authorize('admin', 'coordinator'), adminController.getWalletsWithPercentages);

// POST /api/admin/update-percentage - Updates the percentage for a specific user
router.post('/update-percentage', protect, authorize('admin', 'coordinator'), adminController.updateUserPercentage);

// GET /api/admin/referral-tree/:vendorId - Get referral tree for any vendor (admin only)
router.get('/referral-tree/:vendorId', protect, authorize('admin', 'coordinator'), adminController.getAdminReferralTree);

// GET /api/admin/test-referral-tree/:vendorId - Test endpoint for referral tree
router.get('/test-referral-tree/:vendorId', protect, authorize('admin', 'coordinator'), adminController.getAdminReferralTree);

// =======================================================
// --- INVESTOR APPROVAL ROUTES ---
// =======================================================
router.get('/pending-investors', protect, authorize('admin'), adminController.getPendingInvestors);
router.put('/approve-investor/:investorId', protect, authorize('admin'), adminController.approveInvestor);
router.put('/reject-investor/:investorId', protect, authorize('admin'), adminController.rejectInvestor);

// =======================================================
// --- VENDOR PRODUCT VISIBILITY ROUTES ---
// =======================================================
router.get('/vendors-visibility', protect, authorize('admin', 'coordinator'), adminController.getAllVendorsVisibility);
router.get('/vendors/:vendorId/product-visibility', protect, authorize('admin', 'coordinator'), adminController.getVendorProductVisibility);
router.put('/vendors/:vendorId/product-visibility', protect, authorize('admin', 'coordinator'), adminController.toggleVendorProductVisibility);
router.put('/vendors/bulk-product-visibility', protect, authorize('admin', 'coordinator'), adminController.bulkUpdateProductVisibility);

// =======================================================
// --- MANUAL DEPOSIT ROUTE ---
// =======================================================
router.post('/add-manual-deposit', protect, authorize('admin', 'coordinator'), adminController.addManualDeposit);
router.get('/manual-deposits', protect, authorize('admin', 'coordinator'), adminController.getManualDeposits);

// ================= Withdrawal Settings (Admin Toggle) =================
router.get('/withdrawals/settings', protect, authorize('admin'), adminController.getWithdrawalSettings);
router.put('/withdrawals/settings', protect, authorize('admin'), adminController.updateWithdrawalSettings);

module.exports = router;