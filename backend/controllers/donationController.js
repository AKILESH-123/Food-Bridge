const { Op } = require('sequelize');
const { Donation, User, Notification } = require('../models/index');
const { emitToRole, emitToUser } = require('../utils/socket');

const donorAttrs = ['id', 'name', 'organizationName', 'city', 'profileImage', 'impactPoints'];
const donorFullAttrs = ['id', 'name', 'organizationName', 'phone', 'address', 'city', 'state', 'profileImage', 'totalDonations', 'impactPoints', 'bio'];

// Helper: serialize donation so _id is always present for frontend compatibility
const serializeDonation = (d) => {
  const obj = d.toJSON ? d.toJSON() : { ...d };
  obj._id = obj.id;
  if (obj.donor) obj.donor._id = obj.donor.id;
  if (obj.requestedBy) obj.requestedBy._id = obj.requestedBy.id;
  if (obj.assignedTo) obj.assignedTo._id = obj.assignedTo.id;
  return obj;
};

// @desc    Create a new donation
// @route   POST /api/donations
exports.createDonation = async (req, res) => {
  try {
    const {
      title, description, category, quantity, quantityUnit,
      estimatedServings, expiresAt, pickupAddress, pickupCity,
      specialInstructions, allergenInfo, isVegetarian, isVegan,
    } = req.body;

    const donationData = {
      donorId: req.user.id,
      title, description, category,
      quantity: Number(quantity),
      quantityUnit,
      estimatedServings: Number(estimatedServings) || 0,
      expiresAt,
      pickupAddress, pickupCity,
      specialInstructions, allergenInfo,
      isVegetarian: isVegetarian === 'true' || isVegetarian === true,
      isVegan: isVegan === 'true' || isVegan === true,
    };

    if (req.files && req.files.length > 0) {
      donationData.images = req.files.map((f) => `/uploads/${f.filename}`);
    }

    const donation = await Donation.create(donationData);

    await User.increment(
      { totalDonations: 1, impactPoints: 50 },
      { where: { id: req.user.id } }
    );

    const ngos = await User.findAll({ where: { role: 'ngo', isActive: true }, attributes: ['id'] });
    if (ngos.length > 0) {
      const notifications = ngos.map((ngo) => ({
        recipientId: ngo.id,
        senderId: req.user.id,
        type: 'new_donation',
        title: '🍽️ New Food Donation Available!',
        message: `${req.user.organizationName || req.user.name} posted: "${title}" (${quantity} ${quantityUnit}) in ${pickupCity}`,
        donationId: donation.id,
      }));
      await Notification.bulkCreate(notifications);
    }

    const full = await Donation.findByPk(donation.id, {
      include: [{ model: User, as: 'donor', attributes: donorAttrs }],
    });

    await emitToRole('ngo', 'new_donation', { donation: serializeDonation(full) });

    res.status(201).json({ success: true, donation: serializeDonation(full) });
  } catch (error) {
    console.error('createDonation error:', error);
    res.status(500).json({ success: false, message: 'Failed to create donation' });
  }
};

// @desc    Get all donations (with filters)
// @route   GET /api/donations
exports.getDonations = async (req, res) => {
  try {
    const { status, category, city, urgent, page = 1, limit = 12 } = req.query;

    const where = {};
    if (status) {
      where.status = status;
    } else {
      where.status = { [Op.in]: ['available', 'requested'] };
    }
    if (category) where.category = category;
    if (city) where.pickupCity = { [Op.like]: `%${city}%` };
    if (urgent === 'true') where.isUrgent = true;
    where.expiresAt = { [Op.gt]: new Date() };

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { rows: donations, count: total } = await Donation.findAndCountAll({
      where,
      include: [
        { model: User, as: 'donor', attributes: donorAttrs },
        { model: User, as: 'requestedBy', attributes: ['id', 'name', 'organizationName'] },
      ],
      order: [['isUrgent', 'DESC'], ['createdAt', 'DESC']],
      offset,
      limit: parseInt(limit),
    });

    res.json({
      success: true,
      donations: donations.map(serializeDonation),
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / parseInt(limit)) },
    });
  } catch (error) {
    console.error('getDonations error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch donations' });
  }
};

// @desc    Get single donation
// @route   GET /api/donations/:id
exports.getDonation = async (req, res) => {
  try {
    const donation = await Donation.findByPk(req.params.id, {
      include: [
        { model: User, as: 'donor', attributes: donorFullAttrs },
        { model: User, as: 'requestedBy', attributes: ['id', 'name', 'organizationName', 'phone', 'city'] },
        { model: User, as: 'assignedTo', attributes: ['id', 'name', 'organizationName', 'phone', 'city'] },
      ],
    });

    if (!donation) {
      return res.status(404).json({ success: false, message: 'Donation not found' });
    }

    res.json({ success: true, donation: serializeDonation(donation) });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch donation' });
  }
};

// @desc    Update donation
// @route   PUT /api/donations/:id
exports.updateDonation = async (req, res) => {
  try {
    const donation = await Donation.findByPk(req.params.id);
    if (!donation) {
      return res.status(404).json({ success: false, message: 'Donation not found' });
    }

    if (donation.donorId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to update this donation' });
    }

    if (donation.status !== 'available') {
      return res.status(400).json({ success: false, message: 'Cannot update a donation that is already in progress' });
    }

    await donation.update(req.body);

    const updated = await Donation.findByPk(req.params.id, {
      include: [{ model: User, as: 'donor', attributes: donorAttrs }],
    });

    res.json({ success: true, donation: serializeDonation(updated) });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update donation' });
  }
};

// @desc    Delete donation
// @route   DELETE /api/donations/:id
exports.deleteDonation = async (req, res) => {
  try {
    const donation = await Donation.findByPk(req.params.id);
    if (!donation) {
      return res.status(404).json({ success: false, message: 'Donation not found' });
    }

    if (donation.donorId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this donation' });
    }

    await donation.destroy();
    res.json({ success: true, message: 'Donation removed successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete donation' });
  }
};

// @desc    NGO requests pickup of a donation
// @route   PUT /api/donations/:id/request
exports.requestDonation = async (req, res) => {
  try {
    const donation = await Donation.findByPk(req.params.id, {
      include: [{ model: User, as: 'donor', attributes: ['id', 'name', 'organizationName'] }],
    });
    if (!donation) {
      return res.status(404).json({ success: false, message: 'Donation not found' });
    }

    if (donation.status !== 'available') {
      return res.status(400).json({ success: false, message: 'This donation is no longer available' });
    }

    await donation.update({ status: 'requested', requestedById: req.user.id, requestedAt: new Date() });

    const notification = await Notification.create({
      recipientId: donation.donor.id,
      senderId: req.user.id,
      type: 'donation_requested',
      title: '📦 Pickup Request Received!',
      message: `${req.user.organizationName || req.user.name} wants to pick up your donation: "${donation.title}"`,
      donationId: donation.id,
    });

    emitToUser(donation.donor.id, 'notification', notification);
    emitToUser(donation.donor.id, 'donation_requested', {
      donation: serializeDonation(donation),
      requestedBy: { name: req.user.name, organizationName: req.user.organizationName },
    });

    res.json({ success: true, donation: serializeDonation(donation), message: 'Pickup requested successfully!' });
  } catch (error) {
    console.error('requestDonation error:', error);
    res.status(500).json({ success: false, message: 'Failed to request donation' });
  }
};

// @desc    Donor confirms and assigns donation to NGO
// @route   PUT /api/donations/:id/assign
exports.assignDonation = async (req, res) => {
  try {
    const donation = await Donation.findByPk(req.params.id, {
      include: [{ model: User, as: 'requestedBy', attributes: ['id', 'name', 'organizationName'] }],
    });

    if (!donation) {
      return res.status(404).json({ success: false, message: 'Donation not found' });
    }

    if (donation.donorId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Only the donor can assign this donation' });
    }

    if (donation.status !== 'requested') {
      return res.status(400).json({ success: false, message: 'This donation has not been requested yet' });
    }

    const ngoId = donation.requestedById;
    await donation.update({ status: 'assigned', assignedToId: ngoId, assignedAt: new Date() });

    const notification = await Notification.create({
      recipientId: ngoId,
      senderId: req.user.id,
      type: 'donation_assigned',
      title: '✅ Pickup Confirmed!',
      message: `${req.user.organizationName || req.user.name} confirmed your pickup request for "${donation.title}". Head to the pickup location!`,
      donationId: donation.id,
    });

    emitToUser(ngoId, 'notification', notification);
    emitToUser(ngoId, 'donation_assigned', { donation: serializeDonation(donation) });

    res.json({ success: true, donation: serializeDonation(donation), message: 'Donation assigned successfully!' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to assign donation' });
  }
};

// @desc    Mark donation as completed
// @route   PUT /api/donations/:id/complete
exports.completeDonation = async (req, res) => {
  try {
    const donation = await Donation.findByPk(req.params.id, {
      include: [
        { model: User, as: 'donor', attributes: ['id', 'name'] },
        { model: User, as: 'assignedTo', attributes: ['id', 'name'] },
      ],
    });

    if (!donation) {
      return res.status(404).json({ success: false, message: 'Donation not found' });
    }

    const isAuthorized =
      donation.assignedToId === req.user.id ||
      donation.donorId === req.user.id ||
      req.user.role === 'admin';

    if (!isAuthorized) {
      return res.status(403).json({ success: false, message: 'Not authorized to complete this donation' });
    }

    if (donation.status !== 'assigned') {
      return res.status(400).json({ success: false, message: 'Only assigned donations can be marked as completed' });
    }

    await donation.update({ status: 'completed', completedAt: new Date() });

    if (donation.assignedToId) {
      await User.increment(
        { totalPickups: 1, impactPoints: 30, mealsProvided: donation.estimatedServings || 0 },
        { where: { id: donation.assignedToId } }
      );
    }

    await User.increment({ impactPoints: 20 }, { where: { id: donation.donorId } });

    const donorNotif = await Notification.create({
      recipientId: donation.donorId,
      senderId: donation.assignedToId,
      type: 'donation_completed',
      title: '🌟 Donation Delivered!',
      message: `Your donation "${donation.title}" has been successfully picked up and distributed. You made a difference today!`,
      donationId: donation.id,
    });

    emitToUser(donation.donorId, 'notification', donorNotif);
    emitToUser(donation.donorId, 'donation_completed', { donation: serializeDonation(donation) });

    res.json({ success: true, donation: serializeDonation(donation), message: 'Donation marked as completed!' });
  } catch (error) {
    console.error('completeDonation error:', error);
    res.status(500).json({ success: false, message: 'Failed to complete donation' });
  }
};

// @desc    Cancel a donation
// @route   PUT /api/donations/:id/cancel
exports.cancelDonation = async (req, res) => {
  try {
    const donation = await Donation.findByPk(req.params.id, {
      include: [
        { model: User, as: 'donor', attributes: ['id', 'name', 'organizationName', 'profileImage', 'city', 'phone'] },
        { model: User, as: 'requestedBy', attributes: ['id', 'name', 'organizationName'] },
        { model: User, as: 'assignedTo', attributes: ['id', 'name', 'organizationName'] },
      ],
    });
    if (!donation) {
      return res.status(404).json({ success: false, message: 'Donation not found' });
    }

    if (donation.donorId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    if (['completed', 'expired'].includes(donation.status)) {
      return res.status(400).json({ success: false, message: 'Cannot cancel a completed or expired donation' });
    }

    await donation.update({ status: 'cancelled' });

    // Reverse the points and donation count awarded on creation
    await User.decrement(
      { totalDonations: 1, impactPoints: 50 },
      { where: { id: donation.donorId } }
    );

    if (donation.requestedById) {
      const notification = await Notification.create({
        recipientId: donation.requestedById,
        senderId: req.user.id,
        type: 'donation_cancelled',
        title: '❌ Donation Cancelled',
        message: `The donation "${donation.title}" has been cancelled by the donor.`,
        donationId: donation.id,
      });
      emitToUser(donation.requestedById, 'notification', notification);
    }

    res.json({ success: true, donation: serializeDonation(donation), message: 'Donation cancelled' });
  } catch (error) {
    console.error('cancelDonation error:', error);
    res.status(500).json({ success: false, message: 'Failed to cancel donation' });
  }
};

// @desc    Get donor's own donations
// @route   GET /api/donations/my
exports.getMyDonations = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const where = { donorId: req.user.id };
    if (status) where.status = status;

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { rows: donations, count: total } = await Donation.findAndCountAll({
      where,
      include: [
        { model: User, as: 'requestedBy', attributes: ['id', 'name', 'organizationName', 'city', 'profileImage'] },
        { model: User, as: 'assignedTo', attributes: ['id', 'name', 'organizationName', 'city', 'profileImage'] },
      ],
      order: [['createdAt', 'DESC']],
      offset,
      limit: parseInt(limit),
    });

    res.json({ success: true, donations: donations.map(serializeDonation), total });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch donations' });
  }
};

// @desc    Get NGO's assigned/requested donations
// @route   GET /api/donations/assigned
exports.getAssignedDonations = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const where = {
      [Op.or]: [{ requestedById: req.user.id }, { assignedToId: req.user.id }],
    };
    if (status) where.status = status;

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { rows: donations, count: total } = await Donation.findAndCountAll({
      where,
      include: [
        { model: User, as: 'donor', attributes: ['id', 'name', 'organizationName', 'phone', 'address', 'city', 'profileImage'] },
      ],
      order: [['createdAt', 'DESC']],
      offset,
      limit: parseInt(limit),
    });

    res.json({ success: true, donations: donations.map(serializeDonation), total });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch donations' });
  }
};


