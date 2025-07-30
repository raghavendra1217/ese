<<<<<<< HEAD
// backend/api/routes/authRoutes.js

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');

const authController = require('../controllers/authController');

// --- Define upload directories ---
const PASSPORT_PHOTO_DIR = 'public/passport_photos';
const PAYMENT_SCREENSHOT_DIR = 'public/payment_screenshots';
if (!fs.existsSync(PASSPORT_PHOTO_DIR)) fs.mkdirSync(PASSPORT_PHOTO_DIR, { recursive: true });
if (!fs.existsSync(PAYMENT_SCREENSHOT_DIR)) fs.mkdirSync(PAYMENT_SCREENSHOT_DIR, { recursive: true });

// --- Sequential Filename Generator ---
const getNextSequenceNumber = (dir, prefix) => {
  const files = fs.readdirSync(dir).filter(f => f.startsWith(prefix));
  if (files.length === 0) return 1;
  const numbers = files.map(f => parseInt(f.split('_')[1])).filter(n => !isNaN(n));
  return numbers.length ? Math.max(...numbers) + 1 : 1;
};
const generatePassportPhotoFilename = (req, file, cb) => {
  const nextNum = getNextSequenceNumber(PASSPORT_PHOTO_DIR, 'PP_');
  cb(null, `PP_${String(nextNum).padStart(3, '0')}${path.extname(file.originalname)}`);
};
const generatePaymentScreenshotFilename = (req, file, cb) => {
  const nextNum = getNextSequenceNumber(PAYMENT_SCREENSHOT_DIR, 'PS_');
  cb(null, `PS_${String(nextNum).padStart(3, '0')}${path.extname(file.originalname)}`);
};

// --- Multer Storage Configurations ---
const passportPhotoStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, PASSPORT_PHOTO_DIR),
  filename: generatePassportPhotoFilename,
});
const paymentScreenshotStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, PAYMENT_SCREENSHOT_DIR),
  filename: generatePaymentScreenshotFilename,
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


=======
const express = require('express');
const router = express.Router();
const multer = require('multer');
const authController = require('../controllers/authController');

// Use memoryStorage to process files as buffers, not save them to disk.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }
});

// The controller will now handle file naming and uploading to R2.
router.post('/register', upload.single('passportPhoto'), authController.registerAndProceedToPayment);
router.post('/submit-payment', upload.single('paymentScreenshot'), authController.submitPaymentAndRegister);

// --- Login Flow (No Changes) ---
router.post('/check-email', authController.checkUserStatus);
router.post('/set-password', authController.setPasswordAndLogin);
router.post('/login', authController.loginUser);

>>>>>>> d39126c (wallet update)
module.exports = router;