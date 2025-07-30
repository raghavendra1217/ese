<<<<<<< HEAD
=======
// backend/api/routes/walletRoutes.js
>>>>>>> d39126c (wallet update)
const express = require('express');
const router = express.Router();
const walletController = require('../controllers/walletController');
const { protect } = require('../middleware/authMiddleware');
<<<<<<< HEAD

// GET /api/wallet - fetch or create wallet for current user
router.get('/', protect, walletController.getWallet);

module.exports = router; 
=======
const multer = require('multer');

const upload = multer({ storage: multer.memoryStorage() });

// GET /api/wallet - Fetch user wallet
router.get('/', protect, walletController.getWallet);

// POST /api/wallet/deposit - User submits a deposit request
router.post('/deposit', protect, upload.single('paymentScreenshot'), walletController.requestDeposit);

// --- NEW ROUTE ---
// POST /api/wallet/withdraw - User requests a withdrawal
router.post('/withdraw', protect, walletController.requestWithdrawal);

module.exports = router;
>>>>>>> d39126c (wallet update)
