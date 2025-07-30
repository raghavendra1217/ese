// backend/api/routes/productRoutes.js

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const productController = require('../controllers/productController');
const { protect, authorize } = require('../middleware/authMiddleware');

// --- RESOLVED: Kept your existing Multer configuration ---
// This preserves the feature of saving product images directly to the server's disk
// with a custom sequential naming scheme (e.g., P_001, P_002).
const productImageStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = 'public/products';
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const files = fs.readdirSync('public/products').filter(f => f.startsWith('P_'));
    const nextNum = files.length === 0 ? 1 : Math.max(...files.map(f => parseInt(f.split('_')[1])) || [0]) + 1;
    cb(null, `P_${String(nextNum).padStart(3, '0')}${path.extname(file.originalname)}`);
  },
});
const uploadProductImage = multer({ storage: productImageStorage });


// --- PRODUCT CRUD & STATS ROUTES (Unchanged) ---

// GET Dashboard Stats [Admin Only]
router.get('/stats/dashboard', protect, authorize('admin'), productController.getProductStats);

// POST a new product with an image [Admin Only]
router.post('/', protect, authorize('admin'), uploadProductImage.single('productImage'), productController.addProduct);

// GET all products for management [Admin Only]
router.get('/', protect, authorize('admin'), productController.getAllProducts);

// PUT (update) a product [Admin Only]
router.put('/:productId', protect, authorize('admin'), productController.updateProduct);

// DELETE a product [Admin Only]
router.delete('/:productId', protect, authorize('admin'), productController.deleteProduct);


// --- VENDOR-FACING ROUTES (Unchanged) ---

// GET available products for any authenticated user
router.get('/available', protect, productController.getAvailableProducts);

// GET count of available products
router.get('/stats/available-count', protect, productController.getAvailableProductCount);


module.exports = router;