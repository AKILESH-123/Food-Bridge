const { Op } = require('sequelize');
const { NGORequest, DonorInterest, User, Notification } = require('../models/index');
const { emitToUser, emitToRole } = require('../utils/socket');

// @desc    NGO creates a new community food request
// @route   POST /api/requests
exports.createRequest = async (req, res) => {
  try {
    if (req.user.role === 'ngo' && req.user.verificationStatus !== 'verified') {
      return res.status(403).json({
        success: false,
        message: 'Your NGO account is pending admin verification. Only verified NGOs can post community requests.',
      });
    }

    const {
      title, description, requiredQuantity, quantityUnit,
      targetDate, urgency, targetBeneficiaries, deliveryAddress, city,
    } = req.body;

    const request = await NGORequest.create({
      ngoId: req.user.id,
      title,
      description,
      requiredQuantity: Number(requiredQuantity) || 1,
      quantityUnit: quantityUnit || 'servings',
      targetDate: targetDate || new Date(Date.now() + 24 * 60 * 60 * 1000),
      urgency: urgency || 'normal',
      targetBeneficiaries: Number(targetBeneficiaries) || 0,
      deliveryAddress: deliveryAddress || req.user.address || '',
      city: city || req.user.city || '',
      status: 'open',
    });

    const full = await NGORequest.findByPk(request.id, {
      include: [
        { model: User, as: 'ngo', attributes: ['id', 'name', 'organizationName', 'city', 'profileImage', 'verificationStatus'] },
      ],
    });

    // Notify donors in the community
    await emitToRole('donor', 'new_community_request', { request: full });

    res.status(201).json({ success: true, request: full });
  } catch (error) {
    console.error('createRequest error:', error);
    res.status(500).json({ success: false, message: 'Failed to create community request' });
  }
};

// @desc    Get all open community requests
// @route   GET /api/requests
exports.getRequests = async (req, res) => {
  try {
    const { status = 'open', city, urgency } = req.query;

    const where = {};
    if (status !== 'all') where.status = status;
    if (city) where.city = { [Op.like]: `%${city}%` };
    if (urgency) where.urgency = urgency;

    const requests = await NGORequest.findAll({
      where,
      include: [
        { model: User, as: 'ngo', attributes: ['id', 'name', 'organizationName', 'city', 'profileImage', 'verificationStatus'] },
        {
          model: DonorInterest,
          as: 'interests',
          include: [{ model: User, as: 'donor', attributes: ['id', 'name', 'organizationName'] }],
        },
      ],
      order: [
        ['urgency', 'DESC'],
        ['createdAt', 'DESC'],
      ],
    });

    res.json({ success: true, requests });
  } catch (error) {
    console.error('getRequests error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch community requests' });
  }
};

// @desc    Donor expresses interest in fulfilling or supporting an NGO request ("I Want to Donate")
// @route   POST /api/requests/:id/interest
exports.expressInterest = async (req, res) => {
  try {
    const request = await NGORequest.findByPk(req.params.id, {
      include: [{ model: User, as: 'ngo', attributes: ['id', 'name', 'organizationName'] }],
    });

    if (!request) {
      return res.status(404).json({ success: false, message: 'Community request not found' });
    }

    if (request.status !== 'open') {
      return res.status(400).json({ success: false, message: 'This community request is already closed or fulfilled' });
    }

    const { supportType, pledgedQuantity, pledgedAmount, message, foodItemsDescription } = req.body;

    // Check if donor already expressed interest
    const existing = await DonorInterest.findOne({
      where: {
        requestId: request.id,
        donorId: req.user.id,
        status: { [Op.in]: ['interested', 'accepted'] },
      },
    });

    if (existing) {
      return res.status(400).json({ success: false, message: 'You have already submitted your interest for this request' });
    }

    const interest = await DonorInterest.create({
      requestId: request.id,
      donorId: req.user.id,
      ngoId: request.ngoId,
      supportType: supportType || 'food',
      pledgedQuantity: pledgedQuantity ? Number(pledgedQuantity) : null,
      pledgedAmount: pledgedAmount ? Number(pledgedAmount) : null,
      foodItemsDescription: foodItemsDescription || '',
      message: message || '',
      status: 'interested',
    });

    // Notify the requesting NGO
    const notif = await Notification.create({
      recipientId: request.ngoId,
      senderId: req.user.id,
      type: 'request_interested',
      title: '🤝 A Donor Wants to Support Your Request!',
      message: `${req.user.organizationName || req.user.name} offered support for "${request.title}"`,
      donationId: null,
    });
    emitToUser(request.ngoId, 'notification', notif);
    emitToUser(request.ngoId, 'new_donor_interest', { interest, request });

    res.status(201).json({ success: true, interest, message: 'Thank you! Your interest has been sent to the NGO.' });
  } catch (error) {
    console.error('expressInterest error:', error);
    res.status(500).json({ success: false, message: 'Failed to express interest' });
  }
};

// @desc    Get donor's own expressed interests ("My Interested Donations")
// @route   GET /api/requests/my-interests
exports.getMyInterests = async (req, res) => {
  try {
    const interests = await DonorInterest.findAll({
      where: { donorId: req.user.id },
      include: [
        {
          model: NGORequest,
          as: 'request',
          include: [{ model: User, as: 'ngo', attributes: ['id', 'name', 'organizationName', 'phone', 'city'] }],
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    res.json({ success: true, interests });
  } catch (error) {
    console.error('getMyInterests error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch donor interests' });
  }
};

// @desc    Get interested donors for an NGO's requests
// @route   GET /api/requests/ngo-interests
exports.getNGOInterests = async (req, res) => {
  try {
    const interests = await DonorInterest.findAll({
      where: { ngoId: req.user.id },
      include: [
        { model: NGORequest, as: 'request' },
        { model: User, as: 'donor', attributes: ['id', 'name', 'organizationName', 'phone', 'email', 'city'] },
      ],
      order: [['createdAt', 'DESC']],
    });

    res.json({ success: true, interests });
  } catch (error) {
    console.error('getNGOInterests error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch NGO donor interests' });
  }
};

// @desc    NGO responds to donor interest (accept / decline)
// @route   PUT /api/requests/interest/:id/status
exports.updateInterestStatus = async (req, res) => {
  try {
    const interest = await DonorInterest.findByPk(req.params.id, {
      include: [
        { model: NGORequest, as: 'request' },
        { model: User, as: 'donor', attributes: ['id', 'name'] },
      ],
    });

    if (!interest) return res.status(404).json({ success: false, message: 'Interest record not found' });
    if (interest.ngoId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const { status, responseNotes } = req.body;
    if (!['accepted', 'declined'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    await interest.update({
      status,
      responseNotes: responseNotes || '',
    });

    // Notify the donor of decision
    const notif = await Notification.create({
      recipientId: interest.donorId,
      senderId: req.user.id,
      type: status === 'accepted' ? 'request_accepted' : 'request_declined',
      title: status === 'accepted' ? '🎉 Your Donation Offer Was Accepted!' : 'Donation Offer Update',
      message: `${req.user.organizationName || req.user.name} has ${status} your offer to support "${interest.request.title}".`,
    });
    emitToUser(interest.donorId, 'notification', notif);

    res.json({ success: true, interest, message: `Interest marked as ${status}` });
  } catch (error) {
    console.error('updateInterestStatus error:', error);
    res.status(500).json({ success: false, message: 'Failed to update interest status' });
  }
};
