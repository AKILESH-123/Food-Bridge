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

// @desc    Verify user (admin)
// @route   PUT /api/users/:id/verify
exports.verifyUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, { attributes: publicAttrs });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    await user.update({ isVerified: true });
    res.json({ success: true, user: serialize(user), message: 'User verified successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};


