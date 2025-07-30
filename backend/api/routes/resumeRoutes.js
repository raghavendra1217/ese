// backend/api/routes/resumeRoutes.js

const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs');
const path = require('path'); // Kept for path.extname

const resumeController = require('../controllers/resumeController');
const { protect, authorize } = require('../middleware/authMiddleware');


// --- RESOLVED: Kept your existing Multer Configuration ---
// This preserves the feature of saving files directly to the server's disk
// with a custom sequential naming convention (e.g., R_001, R_002).
const resumeStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = 'public/resumes';
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const files = fs.readdirSync('public/resumes').filter(f => f.startsWith('R_'));
    const nextNum = files.length === 0 ? 1 : Math.max(...files.map(f => parseInt(f.split('_')[1])) || [0]) + 1;
    cb(null, `R_${String(nextNum).padStart(3, '0')}${path.extname(file.originalname)}`);
  },
});

const uploadResumes = multer({
  storage: resumeStorage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});


// --- Routes (Unchanged) ---
// The routes themselves are identical in both versions.

// Handles bulk resume uploads, restricted to admins.
router.post('/upload', protect, authorize('admin'), uploadResumes.array('resumes', 10), resumeController.handleBulkUpload);

// Fetches dashboard statistics, restricted to admins.
router.get('/stats/dashboard', protect, authorize('admin'), resumeController.getDashboardStats);

module.exports = router;