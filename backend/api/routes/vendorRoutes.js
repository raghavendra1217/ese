// backend/api/routes/vendorRoutes.js

const express = require('express');
const router = express.Router();
const vendorController = require('../controllers/vendorController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Existing route
router.get('/stats/dashboard', protect, authorize('vendor'), vendorController.getVendorDashboardStats);

// Existing route (its controller will be updated)
router.get('/referred-list', protect,authorize('vendor'), vendorController.getReferredUsersList);

// --- NEW ROUTE for claiming a referral ---
router.post('/claim-referral', protect,authorize('vendor'), vendorController.claimReferral);

// --- NEW ROUTE for claiming calculated earnings for a referral ---
router.post('/claim-referral-earnings', protect, vendorController.claimReferralEarnings);



module.exports = router;