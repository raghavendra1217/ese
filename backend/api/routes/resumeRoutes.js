// backend/api/routes/resumeRoutes.js

const express = require('express');
const router = express.Router();
const multer = require('multer');
const resumeController = require('../controllers/resumeController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Configure multer for memory storage
const storage = multer.memoryStorage();

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    // Allow PDF, DOC, DOCX, and image files
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/bmp',
      'image/tiff',
      'image/webp'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, DOC, DOCX, and image files (JPG, PNG, GIF, BMP, TIFF, WEBP) are allowed.'), false);
    }
  }
});

// Error handling middleware for multer
const handleMulterError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'File too large. Maximum size is 10MB.' });
    }
  }
  if (error.message.includes('Invalid file type')) {
    return res.status(400).json({ message: error.message });
  }
  next(error);
};

// Routes
router.post('/upload', protect, authorize('admin'), upload.single('resume'), handleMulterError, resumeController.uploadResume);
router.get('/', protect, authorize('admin'), resumeController.getAllResumes);
router.get('/:id/signed-url', protect, authorize('admin'), resumeController.getSignedUrl);
router.get('/:id/ocr', protect, authorize('admin'), resumeController.getOCRText);
router.delete('/:id', protect, authorize('admin'), resumeController.deleteResume);

module.exports = router;
