const express = require('express');
const router = express.Router();
const coordinatorController = require('../controllers/coordinatorController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Apply authentication middleware to all routes
router.use(protect);

// Admin-only routes - apply admin authorization specifically to admin routes
router.post('/admin', authorize('admin'), coordinatorController.addCoordinator);
router.get('/admin', authorize('admin'), coordinatorController.getCoordinators);
router.get('/admin/:coordinatorId', authorize('admin'), coordinatorController.getCoordinatorById);
router.put('/admin/:coordinatorId', authorize('admin'), coordinatorController.updateCoordinator);
router.delete('/admin/:coordinatorId', authorize('admin'), coordinatorController.deleteCoordinator);

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

// Investor management routes (accessible by coordinators)
router.get('/investors/my', coordinatorController.getMyInvestors);
router.get('/investors/unassigned', coordinatorController.getUnassignedInvestors);
router.get('/investors/stats', coordinatorController.getCoordinatorInvestorStats);
router.put('/investors/assign/:investorId', coordinatorController.assignInvestor);
router.delete('/investors/remove/:investorId', coordinatorController.removeInvestor);

// Disbursement routes (accessible by coordinators)
router.get('/disbursements', coordinatorController.getCoordinatorDisbursements);
router.get('/disbursements/stats', coordinatorController.getCoordinatorDisbursementStats);
router.put('/disbursements/:disbursementId', coordinatorController.updateDisbursement);

// Transaction routes (accessible by coordinators only)
router.get('/transactions', authorize('coordinator'), coordinatorController.getCoordinatorVendorTransactions);

// Test endpoint for coordinator transactions (remove after testing)
router.get('/test-transactions', authorize('coordinator'), (req, res) => {
    console.log('🔍 Test transaction endpoint accessed:', {
        user: req.user,
        userRole: req.user?.role,
        userId: req.user?.user_id
    });
    
    res.json({
        success: true,
        message: 'Coordinator transaction endpoint is accessible!',
        user: req.user,
        authorization: 'SUCCESS - Coordinator role verified',
        endpoint: 'GET /api/coordinator/transactions',
        features: [
            'View transactions for assigned vendors only',
            'Search by vendor name, email, phone, transaction ID, description',
            'Filter by transaction type (deposit, withdrawal, purchase, etc.)',
            'Filter by date range',
            'Sort by any column',
            'Paginated results'
        ],
        queryParams: {
            page: 'Page number (default: 1)',
            limit: 'Results per page (default: 10)',
            sortBy: 'Sort column (trans_id, created_at, vendor_name, etc.)',
            sortOrder: 'Sort order (asc/desc)',
            search: 'Search term',
            transaction_type: 'Filter by transaction type',
            startDate: 'Start date filter (YYYY-MM-DD)',
            endDate: 'End date filter (YYYY-MM-DD)'
        },
        timestamp: new Date().toISOString()
    });
});

// Simple role test endpoint
router.get('/test-role', (req, res) => {
    res.json({
        success: true,
        message: 'Role test endpoint - no authorization required',
        user: req.user,
        userRole: req.user?.role,
        userId: req.user?.user_id,
        timestamp: new Date().toISOString()
    });
});

module.exports = router;
