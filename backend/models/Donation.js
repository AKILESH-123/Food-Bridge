const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Donation = sequelize.define(
  'Donation',
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    donorId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'users', key: 'id' },
    },
    title: {
      type: DataTypes.STRING(200),
      allowNull: false,
      validate: { notEmpty: true, len: [1, 200] },
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    category: {
      type: DataTypes.ENUM('cooked', 'packaged', 'raw', 'beverages', 'bakery', 'dairy', 'other'),
      allowNull: false,
    },
    quantity: {
      type: DataTypes.FLOAT,
      allowNull: false,
      validate: { min: 1 },
    },
    quantityUnit: {
      type: DataTypes.ENUM('kg', 'litres', 'servings', 'boxes', 'plates', 'packets', 'pieces'),
      allowNull: false,
    },
    estimatedServings: { type: DataTypes.INTEGER, defaultValue: 0 },
    expiresAt: { type: DataTypes.DATE, allowNull: false },
    pickupAddress: { type: DataTypes.TEXT, allowNull: false },
    pickupCity: { type: DataTypes.STRING(100), allowNull: false },
    images: {
      type: DataTypes.TEXT,
      defaultValue: '[]',
      get() {
        const raw = this.getDataValue('images');
        try { return JSON.parse(raw || '[]'); } catch { return []; }
      },
      set(val) {
        this.setDataValue('images', JSON.stringify(Array.isArray(val) ? val : []));
      },
    },
    status: {
      type: DataTypes.ENUM('available', 'requested', 'assigned', 'completed', 'expired', 'cancelled'),
      defaultValue: 'available',
    },
    isUrgent: { type: DataTypes.BOOLEAN, defaultValue: false },
    isVegetarian: { type: DataTypes.BOOLEAN, defaultValue: false },
    isVegan: { type: DataTypes.BOOLEAN, defaultValue: false },
    requestedById: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: 'users', key: 'id' },
    },
    assignedToId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: 'users', key: 'id' },
    },
    requestedAt: { type: DataTypes.DATE, allowNull: true },
    assignedAt: { type: DataTypes.DATE, allowNull: true },
    completedAt: { type: DataTypes.DATE, allowNull: true },
    specialInstructions: { type: DataTypes.TEXT, allowNull: true },
    allergenInfo: { type: DataTypes.TEXT, allowNull: true },
  },
  {
    tableName: 'donations',
    timestamps: true,
    hooks: {
      beforeSave: (donation) => {
        const now = new Date();
        const twoHoursLater = new Date(now.getTime() + 2 * 60 * 60 * 1000);
        donation.isUrgent = donation.expiresAt <= twoHoursLater && donation.expiresAt > now;
      },
    },
  }
);

module.exports = Donation;

