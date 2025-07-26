// backend/api/routes/resumeRoutes.js

const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs');

const resumeController = require('../controllers/resumeController');
const { protect, authorize } = require('../middleware/authMiddleware'); // <-- IMPORT MIDDLEWARE


// --- Multer Configuration for Resume Uploads ---
// Multer uses a temporary random name. The controller will rename the file.
const resumeStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = 'public/resumes';
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
});

const uploadResumes = multer({
  storage: resumeStorage,
  limits: { fileSize: 10 * 1024 * 1024 }
});


// ... (multer configuration remains the same)

// --- Routes ---
// Resume uploading should be restricted to admins
router.post('/upload', protect, authorize('admin'), uploadResumes.array('resumes', 10), resumeController.handleBulkUpload);

// Resume stats should also be restricted to admins
router.get('/stats/dashboard', protect, authorize('admin'), resumeController.getDashboardStats);

module.exports = router;
