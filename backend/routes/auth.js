const express = require('express');
const router = express.Router();
const { register, login, getMe, googleAuth, verifyNgoPrecheck } = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { body } = require('express-validator');

const upload = require('../middleware/upload');

router.post('/google', googleAuth);
router.post('/verify-ngo', verifyNgoPrecheck);

router.post(
  '/register',
  upload.fields([
    { name: 'organizationDocument', maxCount: 1 },
    { name: 'idProof', maxCount: 1 },
    { name: 'profileImage', maxCount: 1 },
  ]),
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Please enter a valid email'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('role').isIn(['donor', 'ngo']).withMessage('Role must be donor or ngo'),
  ],
  register
);

router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Please enter a valid email'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  login
);

router.get('/me', protect, getMe);

module.exports = router;
