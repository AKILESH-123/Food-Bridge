const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const NGORequest = sequelize.define(
  'NGORequest',
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    ngoId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'users', key: 'id' },
    },
    title: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    foodType: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    mealType: {
      type: DataTypes.ENUM('breakfast', 'lunch', 'dinner', 'snacks', 'other'),
      defaultValue: 'dinner',
    },
    requiredQuantity: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    quantityUnit: {
      type: DataTypes.STRING(50),
      defaultValue: 'servings',
    },
    requiredServings: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    location: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    city: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    latitude: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    longitude: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    requiredBefore: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('open', 'fulfilled', 'cancelled'),
      defaultValue: 'open',
    },
  },
  {
    tableName: 'ngo_requests',
    timestamps: true,
  }
);

module.exports = NGORequest;
