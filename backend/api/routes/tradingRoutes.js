// backend/api/routes/tradingRoutes.js

const express = require('express');
const router = express.Router();
const tradingController = require('../controllers/tradingController');
const { protect } = require('../middleware/authMiddleware');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Multer config for uploading the screenshot.
const proofStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = 'public/proof';
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now();
    cb(null, `${req.body.tradeId}-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});
const uploadProof = multer({ storage: proofStorage });

// This route runs when the user clicks "Proceed to Payment".
router.post('/initiate', protect, tradingController.initiateTrade);

// This route runs when the user clicks the final "Submit Proof" button.
router.post('/submit-proof', protect, uploadProof.single('paymentScreenshot'), tradingController.submitProof);


// --- NEW ROUTE ADDED HERE ---
// @route   GET /api/trading/history
// @desc    Gets the purchase history for the currently logged-in vendor.
router.get('/history', protect, tradingController.getPurchaseHistory);


module.exports = router;