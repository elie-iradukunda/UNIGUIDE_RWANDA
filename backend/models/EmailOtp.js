const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

// One-time passwords are stored as a bcrypt hash, never in plain text, so a
// database read cannot hand an attacker a live verification code.
const EmailOtp = sequelize.define('EmailOtp', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  codeHash: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  purpose: {
    type: DataTypes.ENUM('register', 'reset'),
    allowNull: false,
    defaultValue: 'register',
  },
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  attempts: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  consumedAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  indexes: [{ fields: ['email', 'purpose'] }],
});

module.exports = EmailOtp;
