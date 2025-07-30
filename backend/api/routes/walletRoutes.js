// backend/api/routes/walletRoutes.js

const express = require('express');
const router = express.Router();
const walletController = require('../controllers/walletController');
const { protect } = require('../middleware/authMiddleware');
const multer = require('multer'); // Keep this import for file uploads

// Configure multer to handle file uploads in memory
const upload = multer({ storage: multer.memoryStorage() });

// --- All Routes Merged ---

// GET /api/wallet - Fetch user wallet (present in both versions)
router.get('/', protect, walletController.getWallet);

// POST /api/wallet/deposit - User submits a deposit request (from incoming change)
router.post('/deposit', protect, upload.single('paymentScreenshot'), walletController.requestDeposit);

// POST /api/wallet/withdraw - User requests a withdrawal (from incoming change)
router.post('/withdraw', protect, walletController.requestWithdrawal);

module.exports = router;