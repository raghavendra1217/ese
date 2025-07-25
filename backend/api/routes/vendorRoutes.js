// backend/api/routes/vendorRoutes.js

const express = require('express');
const router = express.Router();
const vendorController = require('../controllers/vendorController');

// GET /api/vendor/stats/dashboard
router.get('/stats/dashboard', vendorController.getVendorDashboardStats);

module.exports = router;