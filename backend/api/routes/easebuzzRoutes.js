// Easebuzz Payment Gateway Routes
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  initiatePayment,
  handleSuccess,
  handleFailure,
  handleWebhook,
  getPaymentStatus,
  getPaymentHistory
} = require('../controllers/easebuzzController');

// Payment initiation route (protected)
router.post('/initiate', protect, initiatePayment);

// Payment callback routes (public - called by Easebuzz)
router.post('/success', handleSuccess);
router.post('/failure', handleFailure);

// Webhook route (public - called by Easebuzz)
router.post('/webhook', handleWebhook);

// Payment status check (protected)
router.get('/status/:txnid', protect, getPaymentStatus);

// Payment history (protected)
router.get('/history', protect, getPaymentHistory);

// Test endpoint to check configuration
router.get('/test', (req, res) => {
  const config = require('../config/easebuzz');
  res.json({
    message: 'Easebuzz configuration test',
    config: {
      env: config.env,
      hasKey: !!config.key,
      hasSalt: !!config.salt,
      isValid: config.isValid(),
      paymentUrl: config.getPaymentUrl(),
      minDepositAmount: parseFloat(process.env.MIN_DEPOSIT_AMOUNT) || 100
    }
  });
});

// Get payment configuration for frontend
router.get('/config', (req, res) => {
  res.json({
    minDepositAmount: parseFloat(process.env.MIN_DEPOSIT_AMOUNT) || 100,
    currency: 'INR'
  });
});

module.exports = router;
