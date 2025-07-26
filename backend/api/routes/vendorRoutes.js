// backend/api/routes/vendorRoutes.js

const express = require('express');
const router = express.Router();
const vendorController = require('../controllers/vendorController');
const { protect, authorize } = require('../middleware/authMiddleware');

// GET /api/vendor/stats/dashboard
router.get('/stats/dashboard', protect, authorize('vendor'), vendorController.getVendorDashboardStats);

module.exports = router;