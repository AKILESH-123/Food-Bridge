const express = require('express');
const router = express.Router();
const {
  getProfile,
  updateProfile,
  getLeaderboard,
  getAllUsers,
  toggleUserStatus,
  verifyUser,
  getVerificationQueue,
  verifyNGOAction,
} = require('../controllers/userController');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.get('/leaderboard', getLeaderboard);
router.get('/profile', protect, getProfile);
router.put('/profile', protect, upload.single('profileImage'), updateProfile);
router.get('/ngos/verification-queue', protect, authorize('admin'), getVerificationQueue);
router.put('/:id/verify-ngo', protect, authorize('admin'), verifyNGOAction);
router.get('/:id/profile', protect, getProfile);
router.get('/', protect, authorize('admin'), getAllUsers);
router.put('/:id/toggle-status', protect, authorize('admin'), toggleUserStatus);
router.put('/:id/verify', protect, authorize('admin'), verifyUser);

module.exports = router;
