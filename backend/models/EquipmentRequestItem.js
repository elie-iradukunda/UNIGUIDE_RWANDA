const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const EquipmentRequestItem = sequelize.define('EquipmentRequestItem', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  requestId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  category: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  quantity: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
    allowNull: false,
  },
  details: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM('Pending', 'In Stock', 'Delivered'),
    defaultValue: 'Pending',
  }
}, {
  timestamps: true,
});

module.exports = EquipmentRequestItem;
