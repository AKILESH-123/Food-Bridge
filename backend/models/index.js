/**
 * models/index.js
 * Loads all Sequelize models, sets up associations, and exports them.
 */
const User = require('./User');
const Donation = require('./Donation');
const Notification = require('./Notification');
const Pickup = require('./Pickup');

// ── Donation associations ──────────────────────────────────────────────────
Donation.belongsTo(User, { as: 'donor', foreignKey: 'donorId' });
Donation.belongsTo(User, { as: 'requestedBy', foreignKey: 'requestedById' });
Donation.belongsTo(User, { as: 'assignedTo', foreignKey: 'assignedToId' });

User.hasMany(Donation, { as: 'donations', foreignKey: 'donorId' });

// ── Notification associations ──────────────────────────────────────────────
Notification.belongsTo(User, { as: 'recipient', foreignKey: 'recipientId' });
Notification.belongsTo(User, { as: 'sender', foreignKey: 'senderId' });
Notification.belongsTo(Donation, { as: 'donation', foreignKey: 'donationId' });

// ── Pickup associations ────────────────────────────────────────────────────
Pickup.belongsTo(Donation, { as: 'donation', foreignKey: 'donationId' });
Pickup.belongsTo(User, { as: 'ngo', foreignKey: 'ngoId' });
Pickup.belongsTo(User, { as: 'donor', foreignKey: 'donorId' });

module.exports = { User, Donation, Notification, Pickup };
