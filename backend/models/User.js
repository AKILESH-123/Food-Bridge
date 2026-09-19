const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const bcrypt = require('bcryptjs');

const User = sequelize.define(
  'User',
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: { notEmpty: true, len: [1, 100] },
    },
    email: {
      type: DataTypes.STRING(150),
      allowNull: false,
      unique: true,
      validate: { isEmail: true },
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    googleId: {
      type: DataTypes.STRING(100),
      allowNull: true,
      unique: true,
    },
    role: {
      type: DataTypes.ENUM('donor', 'ngo', 'admin'),
      defaultValue: 'donor',
    },
    verificationStatus: {
      type: DataTypes.ENUM('pending', 'verified', 'rejected'),
      defaultValue: 'verified', // Will be set to 'pending' for newly registered NGOs
    },
    registrationNumber: { type: DataTypes.STRING(100), allowNull: true },
    registrationType: { type: DataTypes.STRING(100), allowNull: true },
    contactPerson: { type: DataTypes.STRING(100), allowNull: true },
    pincode: { type: DataTypes.STRING(10), allowNull: true },
    serviceArea: { type: DataTypes.STRING(150), allowNull: true },
    serviceRadius: { type: DataTypes.FLOAT, defaultValue: 15.0 }, // km
    organizationDocument: { type: DataTypes.STRING(255), allowNull: true },
    idProof: { type: DataTypes.STRING(255), allowNull: true },
    verifiedBy: { type: DataTypes.INTEGER, allowNull: true },
    verifiedAt: { type: DataTypes.DATE, allowNull: true },
    rejectionReason: { type: DataTypes.TEXT, allowNull: true },
    latitude: { type: DataTypes.FLOAT, allowNull: true },
    longitude: { type: DataTypes.FLOAT, allowNull: true },
    phone: { type: DataTypes.STRING(20), allowNull: true },
    organizationName: { type: DataTypes.STRING(150), allowNull: true },
    address: { type: DataTypes.TEXT, allowNull: true },
    city: { type: DataTypes.STRING(100), allowNull: true },
    state: { type: DataTypes.STRING(100), allowNull: true },
    profileImage: { type: DataTypes.TEXT, defaultValue: '' },
    bio: { type: DataTypes.TEXT, allowNull: true },
    isVerified: { type: DataTypes.BOOLEAN, defaultValue: false },
    isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
    impactPoints: { type: DataTypes.INTEGER, defaultValue: 0 },
    totalDonations: { type: DataTypes.INTEGER, defaultValue: 0 },
    totalPickups: { type: DataTypes.INTEGER, defaultValue: 0 },
    mealsProvided: { type: DataTypes.INTEGER, defaultValue: 0 },
  },
  {
    tableName: 'users',
    timestamps: true,
    hooks: {
      beforeCreate: async (user) => {
        if (user.password) {
          const salt = await bcrypt.genSalt(10);
          user.password = await bcrypt.hash(user.password, salt);
        }
      },
      beforeUpdate: async (user) => {
        if (user.changed('password')) {
          const salt = await bcrypt.genSalt(10);
          user.password = await bcrypt.hash(user.password, salt);
        }
      },
    },
  }
);

User.prototype.matchPassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

module.exports = User;

