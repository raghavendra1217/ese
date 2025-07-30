<<<<<<< HEAD
// In backend/api/routes/tradingRoutes.js

=======
>>>>>>> d39126c (wallet update)
const express = require('express');
const router = express.Router();
const tradingController = require('../controllers/tradingController');
const { protect } = require('../middleware/authMiddleware');
const multer = require('multer');
<<<<<<< HEAD
const path = require('path');
const fs = require('fs');

// --- Multer Config (No changes needed here) ---
const proofStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = 'public/trade_proofs';
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const files = fs.readdirSync('public/trade_proofs').filter(f => f.startsWith('TP_'));
    const nextNum = files.length === 0 ? 1 : Math.max(...files.map(f => parseInt(f.split('_')[1])) || [0]) + 1;
    cb(null, `TP_${String(nextNum).padStart(3, '0')}${path.extname(file.originalname)}`);
  },
});
const uploadProof = multer({ storage: proofStorage });


// --- CLEANED & CORRECTED TRADING ROUTES ---

// POST to create a trade record after UPI payment details are submitted.
// This single route replaces both 'initiate' and 'submit-proof'.
router.post('/create-upi', protect, uploadProof.single('paymentScreenshot'), tradingController.createUpiTrade);

// POST to execute a trade instantly using the wallet.
router.post('/execute-wallet', protect, tradingController.executeWalletTrade);

// POST to sell an item from the wallet.
router.post('/sell', protect, tradingController.sellProduct);

// --- Routes for Vendor Portfolio/History ---
=======

// Use memoryStorage for R2 upload.
const uploadProof = multer({ storage: multer.memoryStorage() });

// --- Trading Routes ---
router.post('/create-upi', protect, uploadProof.single('paymentScreenshot'), tradingController.createUpiTrade);
router.post('/execute-wallet', protect, tradingController.executeWalletTrade);
router.post('/sell', protect, tradingController.sellProduct);

// --- History/Portfolio Routes ---
>>>>>>> d39126c (wallet update)
router.get('/active', protect, tradingController.getActiveTrades);
router.get('/sold', protect, tradingController.getSoldTrades);
router.get('/rejected', protect, tradingController.getRejectedTrades);
router.get('/history', protect, tradingController.getPurchaseHistory);

<<<<<<< HEAD

=======
>>>>>>> d39126c (wallet update)
module.exports = router;