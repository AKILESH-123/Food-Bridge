const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const DonationStatusHistory = sequelize.define(
  'DonationStatusHistory',
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    donationId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'donations', key: 'id' },
    },
    changedById: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'users', key: 'id' },
    },
    previousStatus: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    newStatus: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    action: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    remarks: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    tableName: 'donation_status_history',
    timestamps: true,
  }
);

module.exports = DonationStatusHistory;
