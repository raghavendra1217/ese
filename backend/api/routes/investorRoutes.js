// backend/api/routes/investorRoutes.js

const express = require('express');
const router = express.Router();
const investorController = require('../controllers/investorController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Investor management routes (admin only)
router.get('/', protect, authorize('admin'), investorController.getAllInvestors);
router.get('/stats', protect, authorize('admin'), investorController.getInvestorStats);
router.get('/:id', protect, authorize('admin'), investorController.getInvestorById);
router.post('/', protect, authorize('admin', 'coordinator'), investorController.addInvestor);
router.put('/:id', protect, authorize('admin', 'coordinator'), investorController.updateInvestor);
router.delete('/:id', protect, authorize('admin'), investorController.deleteInvestor);

// Disbursement schedule routes
router.get('/:id/disbursement-schedule', protect, authorize('admin'), investorController.getDisbursementSchedule);
router.get('/disbursement-schedules/all', protect, authorize('admin'), investorController.getAllDisbursementSchedules);
router.put('/:id/disbursement-schedule', protect, authorize('admin'), investorController.updateDisbursementSchedule);
router.post('/disbursement-schedules/fix-all', protect, authorize('admin'), investorController.fixAllDisbursementSchedules);

module.exports = router;
