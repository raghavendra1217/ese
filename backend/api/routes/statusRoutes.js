// Routes for external service status monitoring
const express = require('express');
const router = express.Router();
const { checkCompressorStatus, getMonitoringInfo } = require('../controllers/statusController');
const { protect } = require('../middleware/authMiddleware');

// GET /api/status/compressor - Manual status check
router.get('/compressor', protect, checkCompressorStatus);

// GET /api/status/info - Get monitoring information
router.get('/info', protect, getMonitoringInfo);

module.exports = router;
