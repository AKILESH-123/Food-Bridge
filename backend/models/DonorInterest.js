const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const DonorInterest = sequelize.define(
  'DonorInterest',
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    requestId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: 'ngo_requests', key: 'id' },
    },
    ngoId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'users', key: 'id' },
    },
    donorId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'users', key: 'id' },
    },
    type: {
      type: DataTypes.ENUM('food', 'monetary'),
      defaultValue: 'food',
    },
    proposedFood: {
      type: DataTypes.STRING(200),
      allowNull: true,
    },
    quantity: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    quantityUnit: {
      type: DataTypes.STRING(50),
      defaultValue: 'servings',
    },
    estimatedServings: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    availableTime: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    pickupAddress: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    pickupCity: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    amount: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    paymentStatus: {
      type: DataTypes.STRING(50),
      defaultValue: 'pledged',
    },
    transactionId: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('pending', 'accepted', 'rejected', 'converted_to_donation'),
      defaultValue: 'pending',
    },
  },
  {
    tableName: 'donor_interests',
    timestamps: true,
  }
);

module.exports = DonorInterest;
