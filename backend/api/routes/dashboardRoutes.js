const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { protect } = require('../middleware/authMiddleware');

// Apply authentication middleware to all routes
router.use(protect);

// Dashboard statistics
router.get('/stats', dashboardController.getDashboardStats);

// Disbursement management
router.get('/disbursements', dashboardController.getAllDisbursements);
router.get('/disbursements/upcoming', dashboardController.getUpcomingDisbursements);
router.get('/disbursements/overdue', dashboardController.getOverdueDisbursements);
router.get('/disbursements/:id', dashboardController.getDisbursementById);
router.put('/disbursements/:id/status', dashboardController.updateDisbursementStatus);

module.exports = router;
