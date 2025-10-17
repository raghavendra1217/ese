const express = require('express');
const router = express.Router();
const payslipController = require('../controllers/payslipController');
const { protect } = require('../middleware/authMiddleware');

// Public routes
router.post('/create', payslipController.createPayslip);

// Admin protected routes
router.get('/admin/all', protect, payslipController.getAllPayslips);
router.get('/admin/stats', protect, payslipController.getPayslipStats);
router.get('/admin/:id', protect, payslipController.getPayslipById);
router.put('/admin/:id', protect, payslipController.updatePayslip);
router.delete('/admin/:id', protect, payslipController.deletePayslip);

module.exports = router;
