// backend/api/routes/productRoutes.js

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const productController = require('../controllers/productController');
// Assuming authorize takes a role, e.g., authorize('admin')
const { protect, authorize } = require('../middleware/authMiddleware');

// Your Multer config is excellent, no changes needed here.
const productImageStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = 'public/products';
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});
const uploadProductImage = multer({ storage: productImageStorage });


// --- PRODUCT CRUD & STATS ROUTES ---

// All admin routes are protected and require the 'admin' role.
// The order of middleware is important:
// 1. protect (checks for a valid JWT token)
// 2. authorize (checks if the user has the 'admin' role)
// 3. multer (if needed, to parse form-data and files)
// 4. controller (runs last with req.body and req.file populated)


// GET Dashboard Stats [Admin Only]
// GET /api/products/stats/dashboard
router.get(
    '/stats/dashboard',
    protect,
    authorize('admin'),
    productController.getProductStats
);

// POST a new product with an image [Admin Only]
// POST /api/products/
router.post(
    '/',
    protect,
    authorize('admin'),
    uploadProductImage.single('productImage'), // <--- THE FIX IS HERE
    productController.addProduct
);

// GET all products for management [Admin Only]
// GET /api/products/
router.get(
    '/',
    protect,
    authorize('admin'),
    productController.getAllProducts
);

// PUT (update) a product [Admin Only]
// PUT /api/products/:productId
router.put(
    '/:productId',
    protect,
    authorize('admin'),
    // Note: If you want to allow image updates, you'd add multer here too.
    // For now, it assumes updates are JSON-only.
    productController.updateProduct
);

// DELETE a product [Admin Only]
// DELETE /api/products/:productId
router.delete(
    '/:productId',
    protect,
    authorize('admin'),
    productController.deleteProduct
);


// --- VENDOR-FACING ROUTE ---

// GET available products [Any Authenticated User, e.g., Vendor]
// GET /api/products/available
router.get(
    '/available',
    protect, // Only requires a user to be logged in
    productController.getAvailableProducts
);

module.exports = router;