// backend/api/routes/vendorRoutes.js

const express = require('express');
const multer = require('multer');
const router = express.Router();

const vendorController = require('../controllers/vendorController');
const { protect, authorize } = require('../middleware/authMiddleware');


// ——— Multer configuration ———
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Invalid file type. Only images are allowed.'), false);
  }
});

// ——— Vendor Dashboard Stats ———
router.get(
  '/stats/dashboard',
  protect,
  authorize('vendor'),
  vendorController.getVendorDashboardStats
);

// ——— Referral routes ———
router.get(
  '/referred-list',
  protect,
  authorize('vendor'),
  vendorController.getReferredUsersList
);

// ——— Referral Tree ———
router.get(
  '/referral-tree',
  protect,
  authorize('vendor'),
  vendorController.getReferralTree
);
router.post(
  '/claim-referral',
  protect,
  authorize('vendor'),
  vendorController.claimReferral
);
router.post(
  '/claim-referral-earnings',
  protect,
  authorize('vendor'),
  vendorController.claimReferralEarnings
);
router.get(
  '/unclaimed-commissions',
  protect,
  authorize('vendor'),
  vendorController.getUnclaimedCommissions
);
router.post(
  '/claim-all-commissions',
  protect,
  authorize('vendor'),
  vendorController.claimAllCommissions
);
router.get(
  '/claimed-commissions',
  protect,
  authorize('vendor'),
  vendorController.getClaimedCommissions
);

// ——— Profile CRUD ———
router.get(
  '/profile',
  protect,
  authorize('vendor'),
  vendorController.getVendorProfile
);
// router.put(
//   '/profile',
//   protect,
//   authorize('vendor'),
//   vendorController.updateVendorProfile
// );

// ——— Profile‐Image Upload ———
// ⚠️ `upload.single('profileImage')` must match your frontend FormData key
router.post(
  '/profile-image',
  protect,
  upload.single('profileImage'),
  vendorController.uploadVendorProfileImage 
);

// --- NEW: Dashboard Widget Routes ---
router.get(
  '/dashboard/kpis',
  protect,
  authorize('vendor'),
  vendorController.getDashboardKpis
);

router.get(
  '/dashboard/earnings-over-time',
  protect,
  authorize('vendor'),
  vendorController.getEarningsOverTime
);

router.get(
  '/dashboard/earnings-sources',
  protect,
  authorize('vendor'),
  vendorController.getEarningsSources
);

router.get(
  '/dashboard/recent-activity',
  protect,
  authorize('vendor'),
  vendorController.getRecentActivity
);

router.get(
  '/dashboard/referral-leaderboard',
  protect,
  authorize('vendor'),
  vendorController.getReferralLeaderboard
);

// Add this with your other dashboard widget routes

router.get(
  '/dashboard/my-referrals',
  protect,
  authorize('vendor'),
  vendorController.getDashboardReferralStats
);

// Add this new route to vendorRoutes.js, for example, after the GET /profile route.

router.get(
  '/profile/photo-url',
  protect,
  authorize('vendor'),
  vendorController.getVendorPhotoUrl
);

// ——— Withdrawal Management Routes ———
router.get(
  '/withdrawal-requests',
  protect,
  authorize('vendor'),
  vendorController.getPendingWithdrawals
);

router.post(
  '/reject-withdrawal',
  protect,
  authorize('vendor'),
  vendorController.rejectWithdrawal
);

module.exports = router;
