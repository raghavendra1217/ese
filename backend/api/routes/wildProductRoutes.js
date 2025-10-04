const express = require('express');
const router = express.Router();
const multer = require('multer');

const wildProductController = require('../controllers/wildProductController');
const wildProductTradingController = require('../controllers/wildProductTradingController');
const { protect, authorize } = require('../middleware/authMiddleware');

// =======================================================================
// --- Multer Configuration for Memory Storage ---
// =======================================================================
const storage = multer.memoryStorage();

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB file size limit for wild product images
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images are allowed.'), false);
    }
  }
});

// =======================================================================
// --- WILD PRODUCT ROUTES ---
// =======================================================================

// POST a new wild product with an image [Admin/Coordinator Only]
router.post('/', protect, authorize('admin', 'coordinator'), upload.single('productImage'), wildProductController.addWildProduct);

// GET Dashboard Stats [Admin/Coordinator Only]
router.get('/stats/dashboard', protect, authorize('admin', 'coordinator'), wildProductController.getWildProductStats);

// GET all wild products for management [Admin/Coordinator Only]
router.get('/', protect, authorize('admin', 'coordinator'), wildProductController.getAllWildProducts);

// PUT (update) a wild product [Admin/Coordinator Only]
router.put('/:wildProductId', protect, authorize('admin', 'coordinator'), wildProductController.updateWildProduct);

// DELETE a wild product [Admin/Coordinator Only]
router.delete('/:wildProductId', protect, authorize('admin', 'coordinator'), wildProductController.deleteWildProduct);

// GET available wild products for any authenticated user
router.get('/available', protect, wildProductController.getAvailableWildProducts);

// GET count of available wild products
router.get('/stats/available-count', protect, wildProductController.getAvailableWildProductCount);

// POST increment selling date count [Admin/Coordinator Only]
router.post('/increment-dates', protect, authorize('admin', 'coordinator'), wildProductController.incrementSellingDateCount);

// =======================================================================
// --- WILD PRODUCT TRADING ROUTES ---
// =======================================================================

// POST purchase wild product using wallet [Vendor Only]
router.post('/purchase', protect, authorize('vendor'), wildProductTradingController.purchaseWildProduct);

// GET wild product trading history for vendor [Vendor Only]
router.get('/trading/history', protect, authorize('vendor'), wildProductTradingController.getWildProductTradingHistory);

// GET all wild product trades for admin [Admin/Coordinator Only]
router.get('/trading/all', protect, authorize('admin', 'coordinator'), wildProductTradingController.getAllWildProductTrades);

// GET wild product trading stats for admin dashboard [Admin/Coordinator Only]
router.get('/trading/stats', protect, authorize('admin', 'coordinator'), wildProductTradingController.getWildProductTradingStats);

module.exports = router;
