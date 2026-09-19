/**
 * models/index.js
 * Loads all Sequelize models, sets up associations, and exports them.
 */
const User = require('./User');
const Donation = require('./Donation');
const Notification = require('./Notification');
const Pickup = require('./Pickup');
const DonationStatusHistory = require('./DonationStatusHistory');
const NGORequest = require('./NGORequest');
const DonorInterest = require('./DonorInterest');

// ── Donation associations ──────────────────────────────────────────────────
Donation.belongsTo(User, { as: 'donor', foreignKey: 'donorId' });
Donation.belongsTo(User, { as: 'requestedBy', foreignKey: 'requestedById' });
Donation.belongsTo(User, { as: 'assignedTo', foreignKey: 'assignedToId' });

User.hasMany(Donation, { as: 'donations', foreignKey: 'donorId' });

// ── Status History associations ────────────────────────────────────────────
Donation.hasMany(DonationStatusHistory, { as: 'statusHistory', foreignKey: 'donationId' });
DonationStatusHistory.belongsTo(Donation, { as: 'donation', foreignKey: 'donationId' });
DonationStatusHistory.belongsTo(User, { as: 'changedBy', foreignKey: 'changedById' });

// ── Community NGO Requests & Donor Interest associations ───────────────────
User.hasMany(NGORequest, { as: 'requests', foreignKey: 'ngoId' });
NGORequest.belongsTo(User, { as: 'ngo', foreignKey: 'ngoId' });

NGORequest.hasMany(DonorInterest, { as: 'interests', foreignKey: 'requestId' });
DonorInterest.belongsTo(NGORequest, { as: 'request', foreignKey: 'requestId' });
DonorInterest.belongsTo(User, { as: 'donor', foreignKey: 'donorId' });
DonorInterest.belongsTo(User, { as: 'ngo', foreignKey: 'ngoId' });

// ── Notification associations ──────────────────────────────────────────────
Notification.belongsTo(User, { as: 'recipient', foreignKey: 'recipientId' });
Notification.belongsTo(User, { as: 'sender', foreignKey: 'senderId' });
Notification.belongsTo(Donation, { as: 'donation', foreignKey: 'donationId' });

// ── Pickup associations ────────────────────────────────────────────────────
Pickup.belongsTo(Donation, { as: 'donation', foreignKey: 'donationId' });
Pickup.belongsTo(User, { as: 'ngo', foreignKey: 'ngoId' });
Pickup.belongsTo(User, { as: 'donor', foreignKey: 'donorId' });

const NgoRegistry = require('./NgoRegistry');

module.exports = {
  User,
  Donation,
  Notification,
  Pickup,
  DonationStatusHistory,
  NGORequest,
  DonorInterest,
  NgoRegistry,
};
