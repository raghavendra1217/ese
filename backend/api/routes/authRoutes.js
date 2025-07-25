// backend/api/routes/authRoutes.js

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');

const authController = require('../controllers/authController');

// --- Define upload directories ---
const PASSPORT_PHOTO_DIR = 'public/images';
const PAYMENT_SCREENSHOT_DIR = 'public/payments';
if (!fs.existsSync(PASSPORT_PHOTO_DIR)) fs.mkdirSync(PASSPORT_PHOTO_DIR, { recursive: true });
if (!fs.existsSync(PAYMENT_SCREENSHOT_DIR)) fs.mkdirSync(PAYMENT_SCREENSHOT_DIR, { recursive: true });

// --- Reusable Multer Filename Generator ---
const generateUniqueFilename = (req, file, cb) => {
  const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
  cb(null, uniqueName);
};

// --- Multer Storage Configurations ---
const passportPhotoStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, PASSPORT_PHOTO_DIR),
  filename: generateUniqueFilename,
});
const paymentScreenshotStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, PAYMENT_SCREENSHOT_DIR),
  filename: generateUniqueFilename,
});

const uploadPassportPhoto = multer({ storage: passportPhotoStorage, limits: { fileSize: 5 * 1024 * 1024 } });
const uploadPaymentScreenshot = multer({ storage: paymentScreenshotStorage, limits: { fileSize: 5 * 1024 * 1024 } });

// =======================================================================
// --- CONSOLIDATED AND CORRECTED ROUTES ---
// =======================================================================

// --- Registration & Payment Flow ---
// Step 1: Submit the main registration form
// POST /api/auth/register
router.post('/register', uploadPassportPhoto.single('passportPhoto'), authController.registerAndProceedToPayment);

// Step 2: Submit payment details
// POST /api/auth/submit-payment
router.post('/submit-payment', uploadPaymentScreenshot.single('paymentScreenshot'), authController.submitPaymentAndRegister);


// --- Login Flow ---
// POST /api/auth/check-email
router.post('/check-email', authController.checkUserStatus);

// POST /api/auth/set-password
router.post('/set-password', authController.setPasswordAndLogin);

// POST /api/auth/login
router.post('/login', authController.loginUser);


module.exports = router;