const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
<<<<<<< HEAD
=======
// Assuming the second middleware is for role-based authorization, I'm keeping 'authorize'
>>>>>>> d39126c (wallet update)
const { protect, authorize } = require('../middleware/authMiddleware');

// =======================================================
// --- VENDOR MANAGEMENT ROUTES ---
// =======================================================
<<<<<<< HEAD
router.get('/pending-vendors', protect, authorize('admin'), adminController.getPendingVendors);
router.put('/approve-vendor/:vendorId', protect, authorize('admin'), adminController.approveVendor);
=======
router.get('/vendors/recent', protect, authorize('admin'), adminController.getRecentVendors);
router.get('/vendors/all', protect, authorize('admin'), adminController.getAllVendors);
router.get('/pending-vendors', protect, authorize('admin'), adminController.getPendingVendors);
router.put('/approve-vendor/:vendorId', protect, authorize('admin'), adminController.approveVendor);
router.delete('/reject-vendor/:vendorId', protect, authorize('admin'), adminController.rejectVendor);
>>>>>>> d39126c (wallet update)


// =======================================================
// --- DASHBOARD STATS ROUTE ---
// =======================================================
router.get('/stats/dashboard', protect, authorize('admin'), adminController.getAdminDashboardStats);


<<<<<<< HEAD
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
=======
// =======================================================
// --- TRADING APPROVAL ROUTES ---
// =======================================================
router.get('/pending-trades', protect, authorize('admin'), adminController.getPendingTrades);
router.post('/trades/review', protect, authorize('admin'), adminController.reviewTrade);


// =======================================================
// --- WALLET TRANSACTION ROUTES (NEW) ---
// =======================================================
// Gets the list of pending deposit and withdrawal requests for the approval page
router.get('/pending-wallet-transactions', protect, authorize('admin'), adminController.getPendingWalletTransactions);

// Handles the action of approving or rejecting a specific wallet transaction
router.post('/review-wallet-transaction', protect, authorize('admin'), adminController.reviewWalletTransaction);
>>>>>>> d39126c (wallet update)


module.exports = router;