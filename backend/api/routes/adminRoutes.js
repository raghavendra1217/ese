// backend/api/routes/adminRoutes.js

const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');

// Now, protect these routes. Only logged-in admins can access them.
// The middleware runs in order: `protect` checks for a valid token, then `authorize` checks the role.
router.get('/pending-vendors', adminController.getPendingVendors);
router.put('/approve-vendor/:vendorId', adminController.approveVendor);
router.get('/stats/dashboard', adminController.getAdminDashboardStats);

module.exports = router;