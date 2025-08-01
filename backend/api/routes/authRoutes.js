// backend/api/routes/authRoutes.js

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const authController = require('../controllers/authController');
const ForgotPasswdController = require('../controllers/ForgotPasswdController');

// --- RESOLVED: Kept your existing Multer feature for registration uploads ---
// This preserves the logic of creating directories and generating sequential filenames
// for both passport photos (PP_001) and payment screenshots (PS_001).

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
// --- API Routes (Unchanged) ---
// =======================================================================

// --- Registration & Payment Flow ---
router.post('/register', uploadPassportPhoto.single('passportPhoto'), authController.registerAndProceedToPayment);
router.post('/submit-payment', uploadPaymentScreenshot.single('paymentScreenshot'), authController.submitPaymentAndRegister);

// --- Login Flow ---
router.post('/check-email', authController.checkUserStatus);
router.post('/set-password', authController.setPasswordAndLogin);
router.post('/login', authController.loginUser);

router.post('/request-otp', ForgotPasswdController.requestOtp);
router.post('/verify-otp', ForgotPasswdController.verifyOtp);
router.post('/reset-password', ForgotPasswdController.resetPassword);

module.exports = router;