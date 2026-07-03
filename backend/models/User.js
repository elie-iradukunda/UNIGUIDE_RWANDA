const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  fullName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true,
    },
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  role: {
    type: DataTypes.ENUM('Student', 'Lecturer', 'Admin', 'Lab Staff', 'HOD', 'StockManager', 'IT Support'),
    allowNull: false,
  },
  department: {
    type: DataTypes.ENUM(
      'Renewable Energy',
      'Mechatronic',
      'ICT',
      'Electronic and Telecommunication'
    ),
    allowNull: true,
  },
  studentId: {
    type: DataTypes.STRING, // Matched with "User ID" placeholder
    allowNull: true,
    unique: true,
  },
  avatar: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM('Active', 'Offline', 'Inactive'),
    defaultValue: 'Active',
  },
  // Permissions from AddUserModal
  canBorrow: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  canReserve: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  canViewReports: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
}, {
  timestamps: true,
});

module.exports = User;
