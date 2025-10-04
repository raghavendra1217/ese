const express = require('express');
const router = express.Router();
const quickRegController = require('../controllers/quickRegController');
const { protect } = require('../middleware/authMiddleware');

// Public route for creating quick registration
router.post('/create', quickRegController.createQuickRegistration);

// Admin routes (protected)
router.get('/admin/all', protect, quickRegController.getAllQuickRegistrations);
router.get('/admin/stats', protect, quickRegController.getQuickRegistrationStats);
router.get('/admin/:id', protect, quickRegController.getQuickRegistrationById);
router.put('/admin/:id', protect, quickRegController.updateQuickRegistration);
router.delete('/admin/:id', protect, quickRegController.deleteQuickRegistration);

module.exports = router;
