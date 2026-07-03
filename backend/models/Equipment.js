const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Equipment = sequelize.define('Equipment', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  modelNumber: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  category: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  department: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  serialNumber: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  assetTag: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  purchaseDate: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  warrantyExpiry: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  cost: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
  },
  supplier: {
    type: DataTypes.ENUM('Official Store', 'Amazon Business', 'Local Vendor'),
    allowNull: true,
  },
  requiresMaintenance: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  allowOvernight: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  status: {
    type: DataTypes.STRING,
    defaultValue: 'Available',
  },
  location: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  stock: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
  },
  available: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
  },
  image: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  galleryImages: {
    type: DataTypes.JSON, // Stores array of image URLs
    defaultValue: [],
  },
  videoUrls: {
    type: DataTypes.JSON, // Stores array of YouTube/video URLs
    defaultValue: [],
  },
  manualUrl: {
    type: DataTypes.STRING, // Link to PDF manual or documentation
    allowNull: true,
  },
  qrCode: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  safetyManualUrl: {
    type: DataTypes.STRING,
    allowNull: true,
  },
}, {
  timestamps: true,
});

module.exports = Equipment;
