const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Reservation = sequelize.define('Reservation', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  equipmentId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  startDate: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  endDate: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('Pending', 'Approved', 'Borrowed', 'Returned', 'Overdue', 'Cancelled'),
    defaultValue: 'Pending',
  },
  purpose: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  moduleCode: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  studentRegNumber: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  studentIdNumber: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  studentIdImage: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  phoneNumber: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  level: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  department: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  additionalInfo: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  approvedBy: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  decisionReason: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  returnCondition: {
    type: DataTypes.STRING, // e.g., "Good", "Damaged"
    allowNull: true,
  },
}, {
  timestamps: true,
});

module.exports = Reservation;
