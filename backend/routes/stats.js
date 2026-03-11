const express = require('express');
const router = express.Router();
const { getStats, getDonorStats, getNGOStats, getAdminStats } = require('../controllers/statsController');
const { protect, authorize } = require('../middleware/auth');

router.get('/public', getStats);
router.get('/donor', protect, authorize('donor'), getDonorStats);
router.get('/ngo', protect, authorize('ngo'), getNGOStats);
router.get('/admin', protect, authorize('admin'), getAdminStats);

module.exports = router;
