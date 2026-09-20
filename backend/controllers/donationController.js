const { Op } = require('sequelize');
const { Donation, User, Notification, DonationStatusHistory } = require('../models/index');
const { emitToRole, emitToUser, emitToVerifiedNGOs } = require('../utils/socket');
const { calculateDistance } = require('../utils/distance');
const { calculateFoodSafetyStatus } = require('../utils/foodSafety');

const donorAttrs = ['id', 'name', 'organizationName', 'city', 'profileImage', 'impactPoints'];
const donorFullAttrs = ['id', 'name', 'organizationName', 'phone', 'address', 'city', 'state', 'profileImage', 'totalDonations', 'impactPoints', 'bio'];

// Helper to compute freshness status based on deadline/expiry
const computeFreshness = (deadline, expiresAt) => {
  const targetTime = new Date(deadline || expiresAt).getTime();
  const now = Date.now();
  const diffHours = (targetTime - now) / (1000 * 60 * 60);

  if (diffHours <= 0) return 'expired';
  if (diffHours <= 1.5) return 'urgent';
  if (diffHours <= 3) return 'pickup_soon';
  return 'available';
};

// Helper: serialize donation so _id is always present for frontend compatibility
const serializeDonation = (d, userCoords = null) => {
  const obj = d.toJSON ? d.toJSON() : { ...d };
  obj._id = obj.id;
  if (obj.donor) obj.donor._id = obj.donor.id;
  if (obj.requestedBy) obj.requestedBy._id = obj.requestedBy.id;
  if (obj.assignedTo) obj.assignedTo._id = obj.assignedTo.id;

  // Freshness & Food safety status calculation
  const computed = computeFreshness(obj.pickupDeadline, obj.expiresAt);
  obj.freshnessStatus = computed;
  obj.isUrgent = computed === 'urgent';

  const safety = calculateFoodSafetyStatus(obj);
  obj.safetyStatus = safety;

  // Calculate distance if coordinates are provided
  if (userCoords && userCoords.latitude && userCoords.longitude && obj.latitude && obj.longitude) {
    obj.distanceKm = calculateDistance(
      userCoords.latitude,
      userCoords.longitude,
      obj.latitude,
      obj.longitude
    );
  } else {
    obj.distanceKm = null;
  }

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
      mealType, preparedAt, availableFrom, pickupDeadline,
      latitude, longitude,
      storageMethod, ingredients, safeUseHours,
    } = req.body;

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one photo of the food is compulsory to verify safety and food condition.',
      });
    }

    const donationData = {
      donorId: req.user.id,
      title, description, category,
      quantity: Number(quantity),
      quantityUnit,
      estimatedServings: Number(estimatedServings) || 0,
      expiresAt: expiresAt || pickupDeadline,
      pickupAddress, pickupCity,
      specialInstructions, allergenInfo,
      isVegetarian: isVegetarian === 'true' || isVegetarian === true,
      isVegan: isVegan === 'true' || isVegan === true,
      storageMethod: ['refrigerated', 'covered', 'room_temperature'].includes(storageMethod) ? storageMethod : 'covered',
      ingredients: ingredients || '',
      safeUseHours: safeUseHours ? parseFloat(safeUseHours) : null,
      mealType: mealType || 'other',
      preparedAt: preparedAt || null,
      availableFrom: availableFrom || null,
      pickupDeadline: pickupDeadline || expiresAt || null,
      latitude: latitude ? parseFloat(latitude) : (req.user.latitude || null),
      longitude: longitude ? parseFloat(longitude) : (req.user.longitude || null),
      freshnessStatus: 'available',
      status: 'available',
    };

    if (req.files && req.files.length > 0) {
      donationData.images = req.files.map((f) => `/uploads/${f.filename}`);
    }

    const donation = await Donation.create(donationData);

    // Create initial audit trail in DonationStatusHistory
    await DonationStatusHistory.create({
      donationId: donation.id,
      status: 'available',
      changedById: req.user.id,
      notes: `Donation posted by ${req.user.organizationName || req.user.name}. Meal type: ${donationData.mealType}.`,
    });

    await User.increment(
      { totalDonations: 1, impactPoints: 50 },
      { where: { id: req.user.id } }
    );

    // Get verified NGOs to notify
    const ngos = await User.findAll({
      where: { role: 'ngo', isActive: true, verificationStatus: 'verified' },
      attributes: ['id', 'name', 'latitude', 'longitude', 'serviceRadius'],
    });

    if (ngos.length > 0) {
      const notifications = ngos.map((ngo) => ({
        recipientId: ngo.id,
        senderId: req.user.id,
        type: 'new_donation',
        title: donationData.mealType === 'dinner' ? '🌙 Urgent Dinner Donation Posted!' : '🍽️ New Food Donation Available!',
        message: `${req.user.organizationName || req.user.name} posted: "${title}" (${quantity} ${quantityUnit}) in ${pickupCity}`,
        donationId: donation.id,
      }));
      await Notification.bulkCreate(notifications);
    }

    const full = await Donation.findByPk(donation.id, {
      include: [{ model: User, as: 'donor', attributes: donorAttrs }],
    });

    const serialized = serializeDonation(full);

    // Distance-aware broadcast to nearby verified NGOs
    await emitToVerifiedNGOs(
      'new_donation',
      { donation: serialized, isDinner: donationData.mealType === 'dinner' },
      donationData.latitude,
      donationData.longitude
    );

    res.status(201).json({ success: true, donation: serialized });
  } catch (error) {
    console.error('createDonation error:', error);
    res.status(500).json({ success: false, message: 'Failed to create donation' });
  }
};

// @desc    Get all donations (with filters)
// @route   GET /api/donations
exports.getDonations = async (req, res) => {
  try {
    const {
      status, category, city, urgent, page = 1, limit = 12, period,
      mealType, sortBy, lat, lng,
    } = req.query;

    const userCoords = {
      latitude: lat ? parseFloat(lat) : (req.user && req.user.latitude ? req.user.latitude : null),
      longitude: lng ? parseFloat(lng) : (req.user && req.user.longitude ? req.user.longitude : null),
    };

    const where = {};
    if (status) {
      where.status = status;
    } else {
      where.status = { [Op.in]: ['available', 'requested', 'reserved'] };
    }
    if (category) where.category = category;
    if (mealType) where.mealType = mealType;
    if (city) where.pickupCity = { [Op.like]: `%${city}%` };
    if (urgent === 'true') where.isUrgent = true;

    // Food waste prevention: only show food that has not passed its deadline or expiry
    const now = new Date();
    where[Op.and] = [
      {
        [Op.or]: [
          { pickupDeadline: { [Op.gt]: now } },
          { pickupDeadline: null, expiresAt: { [Op.gt]: now } },
        ],
      },
    ];

    if (period === 'month') {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      where.createdAt = { [Op.gte]: start, [Op.lt]: end };
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);

    let order = [['isUrgent', 'DESC'], ['createdAt', 'DESC']];
    if (sortBy === 'expiring_soon') {
      order = [['expiresAt', 'ASC']];
    }

    const { rows: donations, count: total } = await Donation.findAndCountAll({
      where,
      include: [
        { model: User, as: 'donor', attributes: donorAttrs },
        { model: User, as: 'requestedBy', attributes: ['id', 'name', 'organizationName'] },
        { model: User, as: 'assignedTo', attributes: ['id', 'name', 'organizationName'] },
      ],
      order,
      offset,
      limit: parseInt(limit),
    });

    let serialized = donations.map((d) => serializeDonation(d, userCoords));

    // If sorting by nearest and user coords are present
    if (sortBy === 'nearest' && userCoords.latitude && userCoords.longitude) {
      serialized.sort((a, b) => {
        if (a.distanceKm === null) return 1;
        if (b.distanceKm === null) return -1;
        return a.distanceKm - b.distanceKm;
      });
    }

    res.json({
      success: true,
      donations: serialized,
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

// @desc    NGO requests/claims pickup of a donation
// @route   PUT /api/donations/:id/request
exports.requestDonation = async (req, res) => {
  try {
    // ENFORCE: Only verified NGOs can claim donations
    if (req.user.role === 'ngo' && req.user.verificationStatus !== 'verified') {
      return res.status(403).json({
        success: false,
        message: 'Your NGO account is pending admin verification. Only verified NGOs can claim donations.',
      });
    }

    const donation = await Donation.findByPk(req.params.id, {
      include: [{ model: User, as: 'donor', attributes: ['id', 'name', 'organizationName'] }],
    });
    if (!donation) {
      return res.status(404).json({ success: false, message: 'Donation not found' });
    }

    if (donation.status !== 'available') {
      return res.status(400).json({ success: false, message: 'This donation is no longer available' });
    }

    // Recalculate food safety status on the server: Do not allow bypass if > 75% limit
    const safety = calculateFoodSafetyStatus(donation);
    if (!safety.canAccept || safety.statusKey === 'do_not_distribute') {
      return res.status(400).json({
        success: false,
        message: 'Order cannot proceed: Food exceeds the platform safe-use limit and cannot be distributed.',
        safetyStatus: safety,
      });
    }

    await donation.update({
      status: 'reserved',
      requestedById: req.user.id,
      assignedToId: req.user.id,
      claimedAt: new Date(),
      requestedAt: new Date(),
    });

    // Audit status history: Log accept event
    await DonationStatusHistory.create({
      donationId: donation.id,
      previousStatus: 'available',
      newStatus: 'reserved',
      action: 'accept_order',
      changedById: req.user.id,
      remarks: `Order accepted by ${req.user.organizationName || req.user.name}. Food safety status: ${safety.label} (${safety.percentUsed}% used). Verification at pickup required: ${safety.requiresVerificationAtPickup ? 'Yes' : 'No'}.`,
    });

    const donorId = donation.donorId || donation.donor?.id;

    const notification = await Notification.create({
      recipientId: donorId,
      senderId: req.user.id,
      type: 'donation_requested',
      title: '📦 Donation Claimed & Reserved!',
      message: `${req.user.organizationName || req.user.name} has reserved your donation: "${donation.title}". Please confirm pickup assurance!`,
      donationId: donation.id,
    });

    if (donorId) {
      emitToUser(donorId, 'notification', notification);
      emitToUser(donorId, 'donation_requested', {
        donation: serializeDonation(donation),
        requestedBy: { name: req.user.name, organizationName: req.user.organizationName },
      });
    }

    res.json({ success: true, donation: serializeDonation(donation), message: 'Donation claimed successfully!' });
  } catch (error) {
    console.error('requestDonation error:', error);
    res.status(500).json({ success: false, message: 'Failed to request donation' });
  }
};

// @desc    Donor confirms pickup assurance (Assurance step 2: reserved -> pickup_confirmed)
// @route   POST /api/donations/:id/confirm-pickup
exports.confirmPickup = async (req, res) => {
  try {
    const donation = await Donation.findByPk(req.params.id, {
      include: [{ model: User, as: 'assignedTo', attributes: ['id', 'name', 'organizationName'] }],
    });

    if (!donation) return res.status(404).json({ success: false, message: 'Donation not found' });
    if (donation.donorId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only the donor can confirm pickup' });
    }

    const { scheduledPickupTime, notes } = req.body;

    await donation.update({
      status: 'pickup_confirmed',
      pickupConfirmedAt: new Date(),
    });

    await DonationStatusHistory.create({
      donationId: donation.id,
      previousStatus: 'reserved',
      newStatus: 'pickup_confirmed',
      action: 'confirm_pickup',
      changedById: req.user.id,
      remarks: notes || `Donor confirmed pickup. Ready for NGO pickup.`,
    });

    const targetUserId = donation.assignedToId || donation.requestedById;
    if (targetUserId) {
      const notif = await Notification.create({
        recipientId: targetUserId,
        senderId: req.user.id,
        type: 'donation_assigned',
        title: '✅ Pickup Assured & Confirmed!',
        message: `Donor ${req.user.organizationName || req.user.name} confirmed pickup assurance for "${donation.title}". You can proceed to pick it up!`,
        donationId: donation.id,
      });
      emitToUser(targetUserId, 'notification', notif);
      emitToUser(targetUserId, 'donation_assigned', { donation: serializeDonation(donation) });
    }

    res.json({ success: true, donation: serializeDonation(donation), message: 'Pickup assurance confirmed!' });
  } catch (error) {
    console.error('confirmPickup error:', error);
    res.status(500).json({ success: false, message: 'Failed to confirm pickup' });
  }
};

// @desc    NGO marks donation as picked up with verification checklist (Assurance step 3: pickup_confirmed -> picked_up)
// @route   POST /api/donations/:id/pickup
exports.markPickedUp = async (req, res) => {
  try {
    const donation = await Donation.findByPk(req.params.id);
    if (!donation) return res.status(404).json({ success: false, message: 'Donation not found' });

    const isAssignedNgo = donation.assignedToId === req.user.id || donation.requestedById === req.user.id;
    if (!isAssignedNgo && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only the assigned NGO can mark as picked up' });
    }

    const { checklist, notes } = req.body;

    // Evaluate food safety status
    const safety = calculateFoodSafetyStatus(donation);
    if (safety.statusKey === 'do_not_distribute' || donation.safetyCheckFailed) {
      return res.status(400).json({
        success: false,
        message: 'This food exceeds safe-use limits or failed safety checks and cannot be collected.',
      });
    }

    // If verification checklist was passed, ensure all required boxes were checked
    let checklistPassed = true;
    if (checklist) {
      const requiredKeys = ['packagingIntact', 'noSpoilage', 'correctLabeling', 'appropriateStorage', 'quantityMatches'];
      const passed = requiredKeys.every((k) => checklist[k] === true);
      if (!passed) checklistPassed = false;
    }

    if (!checklistPassed) {
      return res.status(400).json({
        success: false,
        message: 'All checklist items must be verified before collection. If any item fails, use the Reject Donation option.',
      });
    }

    await donation.update({
      status: 'picked_up',
      pickedUpAt: new Date(),
    });

    // Log verification & collection event
    await DonationStatusHistory.create({
      donationId: donation.id,
      previousStatus: 'pickup_confirmed',
      newStatus: 'picked_up',
      action: 'verified_and_collected',
      changedById: req.user.id,
      remarks: notes || `Food verified & collected at pickup by ${req.user.organizationName || req.user.name}. Checklist items 100% verified.`,
    });

    const notif = await Notification.create({
      recipientId: donation.donorId,
      senderId: req.user.id,
      type: 'donation_picked_up',
      title: '🚚 Food Picked Up & Verified!',
      message: `${req.user.organizationName || req.user.name} has verified and collected your donation "${donation.title}". Safe distribution in progress!`,
      donationId: donation.id,
    });
    emitToUser(donation.donorId, 'notification', notif);
    emitToUser(donation.donorId, 'donation_status_updated', {
      donation: serializeDonation(donation),
      status: 'picked_up',
    });

    res.json({
      success: true,
      donation: serializeDonation(donation),
      message: 'Donation marked as picked up & verified! Proceed to distribution.',
    });
  } catch (error) {
    console.error('markPickedUp error:', error);
    res.status(500).json({ success: false, message: 'Failed to update pickup status' });
  }
};

// @desc    Reject donation during pickup verification (requires reason, failed items)
// @route   POST /api/donations/:id/reject
exports.rejectDonation = async (req, res) => {
  try {
    const donation = await Donation.findByPk(req.params.id, {
      include: [{ model: User, as: 'donor', attributes: ['id', 'name', 'organizationName', 'phone'] }],
    });
    if (!donation) return res.status(404).json({ success: false, message: 'Donation not found' });

    const isAuthorized = donation.assignedToId === req.user.id || donation.requestedById === req.user.id || req.user.role === 'admin';
    if (!isAuthorized) {
      return res.status(403).json({ success: false, message: 'Only the assigned NGO can reject this donation at pickup' });
    }

    const { reason, failedChecklistItems } = req.body;
    if (!reason || !reason.trim()) {
      return res.status(400).json({ success: false, message: 'Rejection reason is required' });
    }

    const failedItemsArray = Array.isArray(failedChecklistItems) ? failedChecklistItems : [];
    const prevStatus = donation.status;

    await donation.update({
      status: 'rejected',
      safetyCheckFailed: true,
      rejectionReason: reason.trim(),
      failedChecklistItems: failedItemsArray,
      rejectedAt: new Date(),
      rejectedById: req.user.id,
    });

    // Log rejection event in audit history
    await DonationStatusHistory.create({
      donationId: donation.id,
      previousStatus: prevStatus,
      newStatus: 'rejected',
      action: 'pickup_rejected_safety_check',
      changedById: req.user.id,
      remarks: `Rejected at pickup by ${req.user.organizationName || req.user.name}. Reason: ${reason}. Failed items: ${failedItemsArray.join(', ') || 'None specified'}.`,
    });

    // Notify donor of rejection
    const notif = await Notification.create({
      recipientId: donation.donorId,
      senderId: req.user.id,
      type: 'donation_rejected',
      title: '🔴 Donation Rejected at Pickup',
      message: `Your donation "${donation.title}" was rejected by ${req.user.organizationName || req.user.name} during pickup verification. Reason: ${reason}`,
      donationId: donation.id,
    });
    emitToUser(donation.donorId, 'notification', notif);
    emitToUser(donation.donorId, 'donation_status_updated', {
      donationId: donation.id,
      status: 'rejected',
      rejectionReason: reason,
    });

    res.json({
      success: true,
      donation: serializeDonation(donation),
      message: 'Donation rejected and marked as Do Not Distribute.',
    });
  } catch (error) {
    console.error('rejectDonation error:', error);
    res.status(500).json({ success: false, message: 'Failed to reject donation' });
  }
};

// @desc    NGO confirms delivery with photo, distribution count and remarks
// @route   POST /api/donations/:id/confirm-delivery
exports.confirmDelivery = async (req, res) => {
  try {
    const donation = await Donation.findByPk(req.params.id, {
      include: [{ model: User, as: 'donor', attributes: ['id', 'name', 'email'] }],
    });
    if (!donation) return res.status(404).json({ success: false, message: 'Donation not found' });

    const isAssignedNgo = donation.assignedToId === req.user.id || donation.requestedById === req.user.id;
    if (!isAssignedNgo && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only the assigned NGO can confirm delivery' });
    }

    const { mealsDistributed, deliveryRemarks } = req.body;
    let deliveryPhoto = null;
    if (req.file) {
      deliveryPhoto = `/uploads/${req.file.filename}`;
    }

    const count = parseInt(mealsDistributed) || donation.estimatedServings || 0;

    await donation.update({
      status: 'completed',
      deliveredAt: new Date(),
      completedAt: new Date(),
      deliveryPhoto: deliveryPhoto || donation.deliveryPhoto,
      deliveryRemarks: deliveryRemarks || '',
      mealsDistributed: count,
    });

    // Record in immutable history
    await DonationStatusHistory.create({
      donationId: donation.id,
      previousStatus: 'picked_up',
      newStatus: 'delivered',
      action: 'delivered_and_distributed',
      changedById: req.user.id,
      remarks: `Delivered & distributed ${count} meals. Remarks: ${deliveryRemarks || 'Successfully distributed.'}`,
    });

    // Update impact metrics for both parties
    if (donation.assignedToId) {
      await User.increment(
        { totalPickups: 1, impactPoints: 35, mealsProvided: count },
        { where: { id: donation.assignedToId } }
      );
    }
    await User.increment(
      { impactPoints: 30, mealsProvided: count },
      { where: { id: donation.donorId } }
    );

    // Send digital completion receipt notification to donor
    const donorReceipt = await Notification.create({
      recipientId: donation.donorId,
      senderId: req.user.id,
      type: 'donation_completed',
      title: '🌟 Impact Receipt: Food Delivered!',
      message: `Your donation "${donation.title}" was distributed to ${count} individuals by ${req.user.organizationName || req.user.name}. Thank you for saving food!`,
      donationId: donation.id,
    });
    emitToUser(donation.donorId, 'notification', donorReceipt);

    res.json({
      success: true,
      donation: serializeDonation(donation),
      message: 'Delivery and distribution confirmed successfully!',
    });
  } catch (error) {
    console.error('confirmDelivery error:', error);
    res.status(500).json({ success: false, message: 'Failed to confirm delivery' });
  }
};

// @desc    Get donation audit history trail
// @route   GET /api/donations/:id/history
exports.getDonationHistory = async (req, res) => {
  try {
    const history = await DonationStatusHistory.findAll({
      where: { donationId: req.params.id },
      include: [
        { model: User, as: 'changedBy', attributes: ['id', 'name', 'role', 'organizationName'] },
      ],
      order: [['createdAt', 'ASC']],
    });

    res.json({ success: true, history });
  } catch (error) {
    console.error('getDonationHistory error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch status history' });
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

    const allowedStatuses = ['assigned', 'picked_up', 'delivered', 'pickup_confirmed'];
    if (!allowedStatuses.includes(donation.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot mark as completed: current status is "${donation.status}". Only active in-progress donations can be marked as completed.`,
      });
    }

    const previousStatus = donation.status;
    await donation.update({ status: 'completed', completedAt: new Date() });

    // Log in audit history
    await DonationStatusHistory.create({
      donationId: donation.id,
      previousStatus,
      newStatus: 'completed',
      action: 'mark_completed',
      changedById: req.user.id,
      remarks: `Donation marked as completed by ${req.user.organizationName || req.user.name}.`,
    });

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
    const { status, page = 1, limit = 10, period } = req.query;
    const where = { donorId: req.user.id };
    if (status) where.status = status;

    if (period === 'month') {
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      where.createdAt = { [Op.gte]: start, [Op.lt]: end };
    }

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
    const { status, page = 1, limit = 10, period } = req.query;
    const where = {
      [Op.or]: [{ requestedById: req.user.id }, { assignedToId: req.user.id }],
    };
    if (status) where.status = status;

    if (period === 'month') {
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      where.createdAt = { [Op.gte]: start, [Op.lt]: end };
    }

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


