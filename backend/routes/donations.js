const express = require('express');
const router = express.Router();
const {
  createDonation,
  getDonations,
  getDonation,
  updateDonation,
  deleteDonation,
  requestDonation,
  assignDonation,
  completeDonation,
  cancelDonation,
  getMyDonations,
  getAssignedDonations,
} = require('../controllers/donationController');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.get('/', protect, getDonations);
router.post('/', protect, authorize('donor', 'admin'), upload.array('images', 5), createDonation);
router.get('/my', protect, authorize('donor', 'admin'), getMyDonations);
router.get('/assigned', protect, authorize('ngo', 'admin'), getAssignedDonations);
router.get('/:id', protect, getDonation);
router.put('/:id', protect, authorize('donor', 'admin'), updateDonation);
router.delete('/:id', protect, authorize('donor', 'admin'), deleteDonation);
router.post('/:id/request', protect, authorize('ngo'), requestDonation);
router.post('/:id/assign', protect, authorize('donor', 'admin'), assignDonation);
router.post('/:id/complete', protect, completeDonation);
router.post('/:id/cancel', protect, cancelDonation);

module.exports = router;
