// backend/api/routes/htmlRoutes.js

const express = require('express');
const router = express.Router();
const htmlController = require('../controllers/htmlController');
const { protect, authorize } = require('../middleware/authMiddleware');

// HTML generation routes (public for easy access)
router.get('/investor/:id', htmlController.generateInvestorReport);
router.get('/payslip/:id', htmlController.generatePayslipReport);

module.exports = router;
