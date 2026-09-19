const express = require('express');
const router = express.Router();
const {
  createRequest,
  getRequests,
  expressInterest,
  getMyInterests,
  getNGOInterests,
  updateInterestStatus,
} = require('../controllers/requestController');
const { protect, authorize } = require('../middleware/auth');

router.get('/', protect, getRequests);
router.post('/', protect, authorize('ngo', 'admin'), createRequest);
router.post('/:id/interest', protect, authorize('donor', 'admin'), expressInterest);
router.get('/my-interests', protect, authorize('donor', 'admin'), getMyInterests);
router.get('/ngo-interests', protect, authorize('ngo', 'admin'), getNGOInterests);
router.put('/interest/:id/status', protect, authorize('ngo', 'admin'), updateInterestStatus);

module.exports = router;
