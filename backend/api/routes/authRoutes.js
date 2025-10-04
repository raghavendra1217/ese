// backend/api/routes/authRoutes.js

const express = require('express');
const router = express.Router();
const multer = require('multer');

// --- Import Controllers ---
const authController = require('../controllers/authController');
const ForgotPasswdController = require('../controllers/ForgotPasswdController');

const storage = multer.memoryStorage(); // Use memory storage

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB file size limit
  fileFilter: (req, file, cb) => {
    console.log('🐍 Multer fileFilter called with file:', {
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size
    });
    
    // Optional but recommended: ensure only images are processed
    if (file.mimetype.startsWith('image/')) {
      console.log('✅ File type accepted:', file.mimetype);
      cb(null, true);
    } else {
      console.log('❌ File type rejected:', file.mimetype);
      cb(new Error('Invalid file type. Only images are allowed.'), false);
    }
  }
});

// Add error handling middleware for multer
const handleMulterError = (error, req, res, next) => {
  console.log('❌ Multer error occurred:', error);
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'File too large. Maximum size is 5MB.' });
    }
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({ message: 'Unexpected file field.' });
    }
  }
  if (error.message === 'Invalid file type. Only images are allowed.') {
    return res.status(400).json({ message: error.message });
  }
  next(error);
};

// =======================================================================
// --- API Routes (Updated to use the new 'upload' middleware) ---
// =======================================================================

// --- Registration & Payment Flow ---
// The string 'passportPhoto' must match the name attribute of the file input on your frontend.


router.post('/register', upload.single('passportPhoto'), authController.registerAndProceedToPayment);

// The string 'paymentScreenshot' must match the name attribute for this step.
router.post('/submit-payment', 
  upload.single('paymentScreenshot'), 
  handleMulterError,
  (req, res, next) => {
    console.log('🚀 /submit-payment route hit!');
    console.log('🚀 Request method:', req.method);
    console.log('🚀 Request URL:', req.url);
    console.log('🚀 Request headers:', req.headers);
    console.log('🚀 Request body:', req.body);
    console.log('🚀 Request file:', req.file);
    console.log('🚀 Moving to next middleware...');
    next();
  }, 
  authController.submitPaymentAndRegister
);

// --- Login & Password Reset Flow (No changes here) ---
router.post('/check-email', authController.checkUserStatus);
router.post('/set-password', authController.setPasswordAndLogin);
router.post('/login', authController.loginUser);
router.post('/request-otp', ForgotPasswdController.requestOtp);
router.post('/verify-otp', ForgotPasswdController.verifyOtp);
router.post('/reset-password', ForgotPasswdController.resetPassword);

// --- Test Endpoint for Debugging ---
router.get('/test-db', authController.testDatabase);

// --- Simple Test Endpoint ---
router.get('/test-route', (req, res) => {
    console.log('✅ Test route working - basic GET request successful');
    res.json({ message: 'Route is working', timestamp: new Date().toISOString() });
});

// --- Test POST Endpoint ---
router.post('/test-post', (req, res) => {
    console.log('✅ Test POST route working');
    console.log('✅ Request body:', req.body);
    console.log('✅ Request headers:', req.headers);
    res.json({ 
        message: 'POST route is working', 
        body: req.body,
        timestamp: new Date().toISOString() 
    });
});

// --- Simple submit-payment test (no file upload) ---
router.post('/submit-payment-test', (req, res) => {
    console.log('🧪 /submit-payment-test route hit (no file upload)!');
    console.log('🧪 Request body:', req.body);
    console.log('🧪 Request headers:', req.headers);
    
    // Simulate the same logic but without file upload
    const { email, transactionId } = req.body;
    
    if (!email || !transactionId) {
        return res.status(400).json({ message: 'Email and Transaction ID are required.' });
    }
    
    res.json({ 
        message: 'Test payment submission successful', 
        email: email,
        transactionId: transactionId,
        timestamp: new Date().toISOString() 
    });
});

module.exports = router;