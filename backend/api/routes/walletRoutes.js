const express = require('express');
const router = express.Router();
const walletController = require('../controllers/walletController');
const { protect } = require('../middleware/authMiddleware');

// GET /api/wallet - fetch or create wallet for current user
router.get('/', protect, walletController.getWallet);

module.exports = router; 