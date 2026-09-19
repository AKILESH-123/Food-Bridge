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
    mealType: {
      type: DataTypes.ENUM('breakfast', 'lunch', 'dinner', 'snacks', 'other'),
      defaultValue: 'other',
    },
    preparedAt: { type: DataTypes.DATE, allowNull: true },
    availableFrom: { type: DataTypes.DATE, allowNull: true },
    pickupDeadline: { type: DataTypes.DATE, allowNull: true },
    freshnessStatus: {
      type: DataTypes.ENUM('available', 'pickup_soon', 'urgent', 'expired'),
      defaultValue: 'available',
    },
    latitude: { type: DataTypes.FLOAT, allowNull: true },
    longitude: { type: DataTypes.FLOAT, allowNull: true },
    status: {
      type: DataTypes.ENUM(
        'available',
        'reserved',
        'pickup_confirmed',
        'picked_up',
        'delivered',
        'completed',
        'expired',
        'cancelled',
        'requested',
        'assigned',
        'rejected'
      ),
      defaultValue: 'available',
    },
    isUrgent: { type: DataTypes.BOOLEAN, defaultValue: false },
    isVegetarian: { type: DataTypes.BOOLEAN, defaultValue: false },
    isVegan: { type: DataTypes.BOOLEAN, defaultValue: false },
    storageMethod: {
      type: DataTypes.ENUM('refrigerated', 'covered', 'room_temperature'),
      defaultValue: 'covered',
    },
    ingredients: { type: DataTypes.TEXT, allowNull: true },
    safeUseHours: { type: DataTypes.FLOAT, allowNull: true },
    safetyCheckFailed: { type: DataTypes.BOOLEAN, defaultValue: false },
    rejectionReason: { type: DataTypes.TEXT, allowNull: true },
    failedChecklistItems: {
      type: DataTypes.TEXT,
      defaultValue: '[]',
      get() {
        const raw = this.getDataValue('failedChecklistItems');
        try { return JSON.parse(raw || '[]'); } catch { return []; }
      },
      set(val) {
        this.setDataValue('failedChecklistItems', JSON.stringify(Array.isArray(val) ? val : []));
      },
    },
    rejectedAt: { type: DataTypes.DATE, allowNull: true },
    rejectedById: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: 'users', key: 'id' },
    },
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
    claimedAt: { type: DataTypes.DATE, allowNull: true },
    pickupConfirmedAt: { type: DataTypes.DATE, allowNull: true },
    pickedUpAt: { type: DataTypes.DATE, allowNull: true },
    deliveredAt: { type: DataTypes.DATE, allowNull: true },
    completedAt: { type: DataTypes.DATE, allowNull: true },
    deliveryPhoto: { type: DataTypes.STRING(255), allowNull: true },
    deliveryRemarks: { type: DataTypes.TEXT, allowNull: true },
    mealsDistributed: { type: DataTypes.INTEGER, defaultValue: 0 },
    requestedAt: { type: DataTypes.DATE, allowNull: true },
    assignedAt: { type: DataTypes.DATE, allowNull: true },
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

