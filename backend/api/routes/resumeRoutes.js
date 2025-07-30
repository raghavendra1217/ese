<<<<<<< HEAD
// backend/api/routes/resumeRoutes.js

const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs');
const path = require('path'); // Added for path.extname

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
  filename: (req, file, cb) => {
    const files = fs.readdirSync('public/resumes').filter(f => f.startsWith('R_'));
    const nextNum = files.length === 0 ? 1 : Math.max(...files.map(f => parseInt(f.split('_')[1])) || [0]) + 1;
    cb(null, `R_${String(nextNum).padStart(3, '0')}${path.extname(file.originalname)}`);
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
=======
const express = require('express');
const router = express.Router();
const multer = require('multer');
const resumeController = require('../controllers/resumeController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Use memoryStorage for R2 upload.
const uploadResumes = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }
});

router.post('/upload', protect, authorize('admin'), uploadResumes.array('resumes', 10), resumeController.handleBulkUpload);
router.get('/stats/dashboard', protect, authorize('admin'), resumeController.getDashboardStats);

module.exports = router;
>>>>>>> d39126c (wallet update)
