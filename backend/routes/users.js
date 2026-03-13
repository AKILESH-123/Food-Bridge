const express = require('express');
const router = express.Router();
const {
  getProfile,
  updateProfile,
  getLeaderboard,
  getAllUsers,
  toggleUserStatus,
  verifyUser,
} = require('../controllers/userController');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.get('/leaderboard', getLeaderboard);
router.get('/profile', protect, getProfile);
router.put('/profile', protect, upload.single('profileImage'), updateProfile);
router.get('/:id/profile', protect, getProfile);
router.get('/', protect, authorize('admin'), getAllUsers);
router.put('/:id/toggle-status', protect, authorize('admin'), toggleUserStatus);
router.put('/:id/verify', protect, authorize('admin'), verifyUser);

module.exports = router;
