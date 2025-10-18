const express = require('express');
const router = express.Router();
const productRequestController = require('../controllers/productRequestController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Vendor routes
router.post('/submit', protect, authorize('vendor'), productRequestController.submitProductRequest);
router.get('/current-pending', protect, authorize('vendor'), productRequestController.getCurrentPendingRequest);
router.get('/history', protect, authorize('vendor'), productRequestController.getProductRequestHistory);
router.put('/cancel', protect, authorize('vendor'), productRequestController.cancelProductRequest);

module.exports = router;
