const { User, Notification } = require('../models/index');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const { verifyWithRegistry } = require('../services/ngoRegistryService');

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE || '30d' });

const safeUser = (user) => ({
  _id: user.id,
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  verificationStatus: user.verificationStatus || (user.isVerified ? 'verified' : 'pending'),
  registrationNumber: user.registrationNumber,
  registrationType: user.registrationType,
  contactPerson: user.contactPerson,
  pincode: user.pincode,
  serviceArea: user.serviceArea,
  serviceRadius: user.serviceRadius,
  organizationDocument: user.organizationDocument,
  idProof: user.idProof,
  organizationName: user.organizationName,
  impactPoints: user.impactPoints,
  profileImage: user.profileImage,
  city: user.city,
  state: user.state,
  rejectionReason: user.rejectionReason,
  latitude: user.latitude,
  longitude: user.longitude,
  isVerified: user.isVerified || user.verificationStatus === 'verified',
});

// @desc    Register user
// @route   POST /api/auth/register
exports.register = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const {
      name, email, password, role, organizationName, phone, address, city, state,
      registrationNumber, registrationType, contactPerson, pincode, serviceArea, serviceRadius, bio,
      latitude, longitude,
    } = req.body;

    const existing = await User.findOne({ where: { email } });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Email is already registered' });
    }

    let verificationStatus = role === 'ngo' ? 'pending' : 'verified';
    let isVerified = role !== 'ngo';
    let rejectionReason = null;
    let cleanRegNo = registrationNumber ? registrationNumber.trim().toUpperCase().replace(/\s+/g, '') : null;

    // NGO Specific Validation & Verification
    if (role === 'ngo') {
      if (!cleanRegNo) {
        return res.status(400).json({
          success: false,
          message: 'NGO Registration Number is required.',
        });
      }

      // Check duplicate registration number among NGO accounts
      const duplicateNgo = await User.findOne({
        where: {
          role: 'ngo',
          registrationNumber: cleanRegNo,
        },
      });

      if (duplicateNgo) {
        return res.status(400).json({
          success: false,
          message: `Registration number "${cleanRegNo}" is already registered to another NGO account (${duplicateNgo.organizationName || duplicateNgo.name}).`,
        });
      }

      // Verify with mock government/darpan registry service
      const verificationResultData = await verifyWithRegistry({
        registrationNumber: cleanRegNo,
        ngoName: organizationName || name,
        registrationType,
        state,
      });

      verificationStatus = verificationResultData.verificationStatus;
      isVerified = verificationResultData.isVerified;
      rejectionReason = verificationResultData.reason;
    }

    const userData = {
      name,
      email,
      password,
      role: role || 'donor',
      organizationName: organizationName || name,
      phone,
      address,
      city,
      state,
      registrationNumber: cleanRegNo,
      registrationType: registrationType || null,
      contactPerson,
      pincode,
      serviceArea,
      serviceRadius: serviceRadius ? parseFloat(serviceRadius) : 15.0,
      bio,
      latitude: latitude ? parseFloat(latitude) : null,
      longitude: longitude ? parseFloat(longitude) : null,
      verificationStatus,
      isVerified,
      rejectionReason,
    };

    if (req.files) {
      if (req.files.organizationDocument?.[0]) {
        userData.organizationDocument = `/uploads/${req.files.organizationDocument[0].filename}`;
      }
      if (req.files.idProof?.[0]) {
        userData.idProof = `/uploads/${req.files.idProof[0].filename}`;
      }
      if (req.files.profileImage?.[0]) {
        userData.profileImage = `/uploads/${req.files.profileImage[0].filename}`;
      }
    }

    const user = await User.create(userData);

    // Notify user with tailored messaging based on verification status
    let welcomeTitle = '🎉 Welcome to FoodBridge!';
    let welcomeMsg = `Hello ${user.name}! You've joined FoodBridge as a food donor. Together, let's reduce food waste and feed those in need.`;

    if (role === 'ngo') {
      if (verificationStatus === 'verified') {
        welcomeTitle = '✅ NGO Registration Verified!';
        welcomeMsg = `Congratulations ${user.name}! Your NGO details have been verified with the official registry. You can now browse and claim food donations.`;
      } else if (verificationStatus === 'rejected') {
        welcomeTitle = '⚠️ Verification Failed';
        welcomeMsg = `Hello ${user.name}. Your NGO registration verification could not be completed automatically: ${rejectionReason}`;
      } else {
        welcomeTitle = '⏳ Account Pending Verification';
        welcomeMsg = `Hello ${user.name}! Your NGO account has been created with status "Pending Verification". Our team will review your registration shortly.`;
      }
    }

    await Notification.create({
      recipientId: user.id,
      type: 'welcome',
      title: welcomeTitle,
      message: welcomeMsg,
    });

    // Notify admins if NGO registered
    if (role === 'ngo') {
      const admins = await User.findAll({ where: { role: 'admin' }, attributes: ['id'] });
      if (admins.length > 0) {
        const adminNotifs = admins.map((adm) => ({
          recipientId: adm.id,
          senderId: user.id,
          type: 'ngo_pending_verification',
          title: `📋 New NGO Registration: ${verificationStatus.toUpperCase()}`,
          message: `${userData.organizationName} (${cleanRegNo}) from ${city}, ${state || ''} registered. Status: ${verificationStatus}.`,
        }));
        await Notification.bulkCreate(adminNotifs);
      }
      const { emitToRole } = require('../utils/socket');
      await emitToRole('admin', 'ngo_pending_verification', {
        ngoId: user.id,
        name: user.name,
        organizationName: user.organizationName,
        city: user.city,
        verificationStatus,
      });
    }

    const token = generateToken(user.id);

    res.status(201).json({
      success: true,
      token,
      user: safeUser(user),
      verification: {
        status: verificationStatus,
        isVerified,
        reason: rejectionReason,
      },
      message:
        role === 'ngo' && verificationStatus === 'rejected'
          ? `Account created, but automatic verification failed: ${rejectionReason}`
          : 'Registration successful',
    });
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

// @desc    Pre-check NGO registration number against official registry
// @route   POST /api/auth/verify-ngo
exports.verifyNgoPrecheck = async (req, res) => {
  try {
    const { registrationNumber, ngoName, registrationType, state } = req.body;

    if (!registrationNumber || !registrationNumber.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Registration number is required.',
      });
    }

    const cleanRegNo = registrationNumber.trim().toUpperCase().replace(/\s+/g, '');

    // Check duplicate
    const duplicateNgo = await User.findOne({
      where: {
        role: 'ngo',
        registrationNumber: cleanRegNo,
      },
    });

    if (duplicateNgo) {
      return res.status(400).json({
        success: false,
        isDuplicate: true,
        message: `Registration number "${cleanRegNo}" is already in use by another NGO account (${duplicateNgo.organizationName || duplicateNgo.name}).`,
      });
    }

    const verificationResult = await verifyWithRegistry({
      registrationNumber: cleanRegNo,
      ngoName,
      registrationType,
      state,
    });

    return res.json({
      success: true,
      ...verificationResult,
    });
  } catch (error) {
    console.error('verifyNgoPrecheck error:', error);
    return res.status(500).json({ success: false, message: 'Failed to verify with registry' });
  }
};

