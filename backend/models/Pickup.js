const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Pickup = sequelize.define(
  'Pickup',
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    donationId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'donations', key: 'id' },
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
    scheduledAt: { type: DataTypes.DATE, allowNull: false },
    completedAt: { type: DataTypes.DATE, allowNull: true },
    status: {
      type: DataTypes.ENUM('scheduled', 'in-progress', 'completed', 'cancelled'),
      defaultValue: 'scheduled',
    },
    notes: { type: DataTypes.TEXT, allowNull: true },
    estimatedBeneficiaries: { type: DataTypes.INTEGER, defaultValue: 0 },
    actualBeneficiaries: { type: DataTypes.INTEGER, defaultValue: 0 },
    donorRating: { type: DataTypes.TINYINT, allowNull: true },
    donorReview: { type: DataTypes.TEXT, allowNull: true },
    donorRatedAt: { type: DataTypes.DATE, allowNull: true },
    ngoRating: { type: DataTypes.TINYINT, allowNull: true },
    ngoReview: { type: DataTypes.TEXT, allowNull: true },
    ngoRatedAt: { type: DataTypes.DATE, allowNull: true },
  },
  {
    tableName: 'pickups',
    timestamps: true,
  }
);

module.exports = Pickup;

