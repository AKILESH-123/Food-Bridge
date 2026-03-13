const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Notification = sequelize.define(
  'Notification',
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    recipientId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'users', key: 'id' },
    },
    senderId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: 'users', key: 'id' },
    },
    type: {
      type: DataTypes.ENUM(
        'new_donation',
        'donation_requested',
        'donation_assigned',
        'donation_completed',
        'donation_expired',
        'donation_cancelled',
        'system',
        'welcome'
      ),
      allowNull: false,
    },
    title: { type: DataTypes.STRING(255), allowNull: false },
    message: { type: DataTypes.TEXT, allowNull: false },
    donationId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: 'donations', key: 'id' },
    },
    isRead: { type: DataTypes.BOOLEAN, defaultValue: false },
    readAt: { type: DataTypes.DATE, allowNull: true },
  },
  {
    tableName: 'notifications',
    timestamps: true,
  }
);

module.exports = Notification;

