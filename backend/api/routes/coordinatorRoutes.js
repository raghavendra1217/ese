const express = require('express');
const router = express.Router();
const coordinatorController = require('../controllers/coordinatorController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Apply authentication middleware to all routes
router.use(protect);
router.use(authorize('admin'));

// CRUD routes for coordinators
router.post('/', coordinatorController.addCoordinator);
router.get('/', coordinatorController.getCoordinators);
router.get('/:coordinatorId', coordinatorController.getCoordinatorById);
router.put('/:coordinatorId', coordinatorController.updateCoordinator);
router.delete('/:coordinatorId', coordinatorController.deleteCoordinator);

module.exports = router;
