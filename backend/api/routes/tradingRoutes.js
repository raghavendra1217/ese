// backend/api/routes/tradingRoutes.js

const express = require('express');
const router = express.Router();
const tradingController = require('../controllers/tradingController');
const { protect } = require('../middleware/authMiddleware');
const multer = require('multer');

// --- RESOLVED: Use memoryStorage for modern, scalable cloud uploads ---
// This approach holds the file in memory instead of saving it to the local disk,
// making it compatible with hosting platforms like Vercel and Render.
const uploadProof = multer({ storage: multer.memoryStorage() });


// --- Trading and Purchase Routes ---
// The following routes are functionally the same in both versions and are all included.

// POST to create a trade record using UPI payment details.
router.post('/create-upi', protect, uploadProof.single('paymentScreenshot'), tradingController.createUpiTrade);

// POST to execute a trade instantly using the wallet balance.
router.post('/execute-wallet', protect, tradingController.executeWalletTrade);

// POST to sell a product/stock from the user's portfolio.
router.post('/sell', protect, tradingController.sellProduct);


// --- Routes for fetching Portfolio and History Data ---
router.get('/active', protect, tradingController.getActiveTrades);
router.get('/sold', protect, tradingController.getSoldTrades);
router.get('/rejected', protect, tradingController.getRejectedTrades);
router.get('/history', protect, tradingController.getPurchaseHistory);


module.exports = router;