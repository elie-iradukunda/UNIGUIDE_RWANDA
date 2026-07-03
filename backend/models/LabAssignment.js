const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const LabAssignment = sequelize.define('LabAssignment', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  equipmentId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  equipmentName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
  },
  labLocation: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  assignedById: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  assignedByName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  assignedToId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  assignedToName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  department: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  status: {
    type: DataTypes.STRING,
    defaultValue: 'Pending',
    // Pending → Received / Rejected
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  receivedAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  timestamps: true,
});

module.exports = LabAssignment;
