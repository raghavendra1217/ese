// backend/api/routes/tableRoutes.js

const express = require('express');
const router = express.Router();
const tableController = require('../controllers/tableController');
const { protect, authorize } = require('../middleware/authMiddleware');

// @desc    Get all transactions with pagination, sorting, and filtering
// @route   GET /api/table/transactions
// @access  Private/Admin
router.get('/transactions', protect, authorize('admin') , tableController.getAllTransactions);


// You can add more routes here in the future for other tables
// e.g., router.get('/vendors', protect, admin, tableController.getAllVendors);

module.exports = router;