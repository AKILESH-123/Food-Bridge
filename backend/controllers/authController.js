const { User, Notification } = require('../models/index');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE || '30d' });

const safeUser = (user) => ({
  _id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  organizationName: user.organizationName,
  impactPoints: user.impactPoints,
  profileImage: user.profileImage,
  city: user.city,
});

// @desc    Register user
// @route   POST /api/auth/register
exports.register = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { name, email, password, role, organizationName, phone, address, city, state } = req.body;

    const existing = await User.findOne({ where: { email } });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Email is already registered' });
    }

    const user = await User.create({ name, email, password, role, organizationName, phone, address, city, state });

    await Notification.create({
      recipientId: user.id,
      type: 'welcome',
      title: '🎉 Welcome to FoodBridge!',
      message: `Hello ${user.name}! You've joined FoodBridge as a ${role}. Together, let's reduce food waste and feed those in need.`,
    });

    const token = generateToken(user.id);

    res.status(201).json({ success: true, token, user: safeUser(user) });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ success: false, message: 'Server error during registration' });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
exports.login = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { email, password } = req.body;

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    if (!user.isActive) {
      return res.status(401).json({ success: false, message: 'Your account has been deactivated. Contact support.' });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const token = generateToken(user.id);

    res.json({ success: true, token, user: safeUser(user) });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Server error during login' });
  }
};

// @desc    Get current user
// @route   GET /api/auth/me
exports.getMe = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password'] },
    });
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Google Sign-In / Sign-Up
// @route   POST /api/auth/google
exports.googleAuth = async (req, res) => {
  try {
    const { credential, role = 'donor' } = req.body;
    if (!credential) {
      return res.status(400).json({ success: false, message: 'Google credential token is required' });
    }

    const { OAuth2Client } = require('google-auth-library');
    const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

    let ticket;
    try {
      ticket = await client.verifyIdToken({
        idToken: credential,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
    } catch (verifyErr) {
      console.error('Google token verification failed:', verifyErr.message);
      return res.status(401).json({ success: false, message: 'Invalid or expired Google token' });
    }

    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture } = payload;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Google account does not provide an email' });
    }

    // Find user by email or googleId
    let user = await User.findOne({ where: { email } });

    if (user) {
      // If user exists, link googleId and profile image if missing
      let needsSave = false;
      if (!user.googleId) {
        user.googleId = googleId;
        needsSave = true;
      }
      if (picture && (!user.profileImage || user.profileImage.includes('googleusercontent.com'))) {
        user.profileImage = picture;
        needsSave = true;
      }
      if (needsSave) {
        await user.save();
      }

      if (!user.isActive) {
        return res.status(401).json({ success: false, message: 'Your account has been deactivated. Contact support.' });
      }
    } else {
      // Create new user with selected role (donor or ngo)
      const assignedRole = ['donor', 'ngo'].includes(role) ? role : 'donor';
      user = await User.create({
        name: name || email.split('@')[0],
        email,
        googleId,
        role: assignedRole,
        profileImage: picture || '',
        isVerified: true,
        city: 'Not Specified',
      });

      await Notification.create({
        recipientId: user.id,
        type: 'welcome',
        title: '🎉 Welcome to FoodBridge!',
        message: `Hello ${user.name}! You have signed in with Google as a ${assignedRole}. Let's make an impact together!`,
      });
    }

    const token = generateToken(user.id);
    return res.json({
      success: true,
      token,
      user: safeUser(user),
    });
  } catch (error) {
    console.error('Google Auth Error:', error);
    return res.status(500).json({ success: false, message: 'Authentication with Google failed' });
  }
};

