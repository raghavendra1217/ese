const express = require('express');
const router = express.Router();
const coordinatorController = require('../controllers/coordinatorController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Apply authentication middleware to all routes
router.use(protect);

// Admin-only routes
router.use('/admin', authorize('admin'));
router.post('/admin', coordinatorController.addCoordinator);
router.get('/admin', coordinatorController.getCoordinators);
router.get('/admin/:coordinatorId', coordinatorController.getCoordinatorById);
router.put('/admin/:coordinatorId', coordinatorController.updateCoordinator);
router.delete('/admin/:coordinatorId', coordinatorController.deleteCoordinator);

// Coordinator profile route (accessible by coordinators)
router.get('/profile', coordinatorController.getCoordinatorProfile);

// Get all coordinators (accessible by coordinators)
router.get('/', coordinatorController.getCoordinators);

// Get all vendors (accessible by coordinators)
router.get('/vendors/paginated', coordinatorController.getVendorsPaginated);

// Get count of MY vendors (accessible by coordinators)
router.get('/vendors/my-count', coordinatorController.getMyVendorsCount);

// Get vendors from last 8 days (accessible by coordinators)
router.get('/vendors/last8days', coordinatorController.getVendorsLast8Days);

// Get paginated vendors from last 8 days (accessible by coordinators)
router.get('/vendors/last8days/paginated', coordinatorController.getVendorsLast8DaysPaginated);

// Get count of MY vendors from last 8 days (accessible by coordinators)
router.get('/vendors/last8days/my-count', coordinatorController.getMyVendorsLast8DaysCount);

// Get vendors from today (accessible by coordinators)
router.get('/vendors/today', coordinatorController.getVendorsToday);

// Get paginated vendors from today (accessible by coordinators)
router.get('/vendors/today/paginated', coordinatorController.getVendorsTodayPaginated);

// Get count of MY vendors from today (accessible by coordinators)
router.get('/vendors/today/my-count', coordinatorController.getMyVendorsTodayCount);

// Vendor assignment route (accessible by coordinators)
router.put('/assign-vendor/:vendorId', coordinatorController.assignVendor);

// Vendor removal route (accessible by coordinators)
router.delete('/remove-vendor/:vendorId', coordinatorController.removeVendor);

module.exports = router;
