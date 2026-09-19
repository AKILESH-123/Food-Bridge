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
  confirmPickup,
  markPickedUp,
  rejectDonation,
  confirmDelivery,
  getDonationHistory,
} = require('../controllers/donationController');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.get('/', protect, getDonations);
router.post('/', protect, authorize('donor', 'admin'), upload.array('images', 5), createDonation);
router.get('/my', protect, authorize('donor', 'admin'), getMyDonations);
router.get('/assigned', protect, authorize('ngo', 'admin'), getAssignedDonations);
router.get('/:id', protect, getDonation);
router.get('/:id/history', protect, getDonationHistory);
router.put('/:id', protect, authorize('donor', 'admin'), updateDonation);
router.delete('/:id', protect, authorize('donor', 'admin'), deleteDonation);
router.post('/:id/request', protect, authorize('ngo'), requestDonation);
router.post('/:id/confirm-pickup', protect, authorize('donor', 'admin'), confirmPickup);
router.post('/:id/pickup', protect, authorize('ngo', 'admin'), markPickedUp);
router.post('/:id/reject', protect, authorize('ngo', 'admin'), rejectDonation);
router.post('/:id/confirm-delivery', protect, authorize('ngo', 'admin'), upload.single('deliveryPhoto'), confirmDelivery);
router.post('/:id/assign', protect, authorize('donor', 'admin'), assignDonation);
router.post('/:id/complete', protect, completeDonation);
router.post('/:id/cancel', protect, cancelDonation);

module.exports = router;
