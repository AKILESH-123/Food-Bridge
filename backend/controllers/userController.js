const { User } = require('../models/index');
const { Op } = require('sequelize');

const publicAttrs = ['id', 'name', 'email', 'role', 'phone', 'organizationName', 'address', 'city', 'state', 'profileImage', 'bio', 'isVerified', 'isActive', 'impactPoints', 'totalDonations', 'totalPickups', 'mealsProvided', 'createdAt'];

const serialize = (u) => {
  const obj = u.toJSON ? u.toJSON() : { ...u };
  obj._id = obj.id;
  return obj;
};

// @desc    Get user profile (own or by id)
// @route   GET /api/users/profile  |  GET /api/users/:id/profile
exports.getProfile = async (req, res) => {
  try {
    const userId = req.params.id || req.user.id;
    const user = await User.findByPk(userId, { attributes: publicAttrs });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({ success: true, user: serialize(user) });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Update own profile
// @route   PUT /api/users/profile
exports.updateProfile = async (req, res) => {
  try {
    const { name, phone, address, city, state, organizationName, bio } = req.body;
    const updateData = {};

    if (name) updateData.name = name;
    if (phone) updateData.phone = phone;
    if (address) updateData.address = address;
    if (city) updateData.city = city;
    if (state) updateData.state = state;
    if (organizationName) updateData.organizationName = organizationName;
    if (bio !== undefined) updateData.bio = bio;

    if (req.file) {
      updateData.profileImage = `/uploads/${req.file.filename}`;
    }

    await User.update(updateData, { where: { id: req.user.id } });

    const user = await User.findByPk(req.user.id, { attributes: publicAttrs });

    res.json({ success: true, user: serialize(user) });
  } catch (error) {
    console.error('updateProfile error:', error);
    res.status(500).json({ success: false, message: 'Failed to update profile' });
  }
};

// @desc    Get leaderboard
// @route   GET /api/users/leaderboard
exports.getLeaderboard = async (req, res) => {
  try {
    const { type = 'donors' } = req.query;
    const role = type === 'ngos' ? 'ngo' : 'donor';

    const countField = role === 'donor' ? 'totalDonations' : 'totalPickups';
    const users = await User.findAll({
      where: { role, isActive: true, [countField]: { [Op.gt]: 0 } },
      attributes: ['id', 'name', 'organizationName', 'profileImage', 'impactPoints', 'totalDonations', 'totalPickups', 'mealsProvided', 'city'],
      order: [['impactPoints', 'DESC']],
      limit: 20,
    });

    res.json({ success: true, leaderboard: users.map(serialize) });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch leaderboard' });
  }
};

// @desc    Get all users (admin only)
// @route   GET /api/users
exports.getAllUsers = async (req, res) => {
  try {
    const { role, page = 1, limit = 20 } = req.query;
    const where = {};
    if (role) where.role = role;

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { rows: users, count: total } = await User.findAndCountAll({
      where,
      attributes: publicAttrs,
      order: [['createdAt', 'DESC']],
      offset,
      limit: parseInt(limit),
    });

    res.json({ success: true, users: users.map(serialize), total });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Toggle user active status (admin)
// @route   PUT /api/users/:id/toggle-status
exports.toggleUserStatus = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    await user.update({ isActive: !user.isActive });
    res.json({ success: true, user: serialize(user), message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully` });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Toggle/Set user verification status (admin)
// @route   PUT /api/users/:id/verify
exports.verifyUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    const nextStatus = !user.isVerified;
    await user.update({ 
      isVerified: nextStatus,
      verificationStatus: nextStatus ? 'verified' : 'pending'
    });
    res.json({ 
      success: true, 
      user: serialize(user), 
      message: `User ${nextStatus ? 'verified' : 'unverified'} successfully` 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get NGO verification queue (admin)
// @route   GET /api/users/ngos/verification-queue
exports.getVerificationQueue = async (req, res) => {
  try {
    const { status } = req.query;
    const where = { role: 'ngo' };
    if (status && status !== 'all') {
      where.verificationStatus = status;
    }

    const ngos = await User.findAll({
      where,
      attributes: [
        'id', 'name', 'email', 'organizationName', 'phone', 'address', 'city', 'state',
        'pincode', 'serviceArea', 'serviceRadius', 'registrationNumber', 'contactPerson',
        'organizationDocument', 'idProof', 'verificationStatus', 'isVerified',
        'rejectionReason', 'verifiedAt', 'verifiedBy', 'createdAt',
      ],
      order: [['createdAt', 'DESC']],
    });

    res.json({ success: true, ngos: ngos.map(serialize) });
  } catch (error) {
    console.error('getVerificationQueue error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch verification queue' });
  }
};

// @desc    Admin approve, reject or request re-verification for NGO
// @route   PUT /api/users/:id/verify-ngo
exports.verifyNGOAction = async (req, res) => {
  try {
    const { action, rejectionReason } = req.body; // 'approve' | 'reject' | 'reverify'
    const user = await User.findByPk(req.params.id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'NGO not found' });
    }

    if (user.role !== 'ngo') {
      return res.status(400).json({ success: false, message: 'User is not an NGO' });
    }

    const { Notification } = require('../models/index');
    const { emitToUser } = require('../utils/socket');

    if (action === 'approve') {
      await user.update({
        verificationStatus: 'verified',
        isVerified: true,
        verifiedBy: req.user.id,
        verifiedAt: new Date(),
        rejectionReason: null,
      });

      const notif = await Notification.create({
        recipientId: user.id,
        type: 'ngo_approved',
        title: '🟢 NGO Verified Successfully!',
        message: 'Congratulations! Your NGO has been verified by the administrator. You can now claim surplus food donations nearby.',
      });

      emitToUser(user.id, 'notification', notif);
      emitToUser(user.id, 'ngo_status_updated', { verificationStatus: 'verified', isVerified: true });

      return res.json({ success: true, message: 'NGO approved and verified successfully', user: serialize(user) });
    } else if (action === 'reject') {
      await user.update({
        verificationStatus: 'rejected',
        isVerified: false,
        rejectionReason: rejectionReason || 'Documents did not meet criteria.',
      });

      const notif = await Notification.create({
        recipientId: user.id,
        type: 'ngo_rejected',
        title: '🔴 NGO Verification Rejected',
        message: `Your verification request was rejected. Reason: ${rejectionReason || 'Submitted details could not be validated.'}`,
      });

      emitToUser(user.id, 'notification', notif);
      emitToUser(user.id, 'ngo_status_updated', { verificationStatus: 'rejected', isVerified: false });

      return res.json({ success: true, message: 'NGO rejected', user: serialize(user) });
    } else if (action === 'reverify') {
      await user.update({
        verificationStatus: 'pending',
        isVerified: false,
        rejectionReason: rejectionReason || 'Please re-upload clearer documents.',
      });

      const notif = await Notification.create({
        recipientId: user.id,
        type: 'ngo_reverify',
        title: '🟡 Additional Verification Information Needed',
        message: `Please update your registration details or re-upload documents: ${rejectionReason || 'Clearer proof required.'}`,
      });

      emitToUser(user.id, 'notification', notif);
      emitToUser(user.id, 'ngo_status_updated', { verificationStatus: 'pending', isVerified: false });

      return res.json({ success: true, message: 'Re-verification requested from NGO', user: serialize(user) });
    }

    res.status(400).json({ success: false, message: 'Invalid verification action' });
  } catch (error) {
    console.error('verifyNGOAction error:', error);
    res.status(500).json({ success: false, message: 'Failed to process verification action' });
  }
};


