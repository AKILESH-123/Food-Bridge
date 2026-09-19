const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const NgoRegistry = sequelize.define(
  'NgoRegistry',
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    registrationNumber: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
    },
    ngoName: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    registrationType: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    state: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('Active', 'Inactive'),
      defaultValue: 'Active',
    },
  },
  {
    tableName: 'ngo_registries',
    timestamps: true,
  }
);

module.exports = NgoRegistry;
