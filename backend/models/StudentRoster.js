const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

/**
 * The official enrolment list, loaded from the college registry.
 *
 * This is what proves somebody is a real Tumba student. An email domain cannot:
 * the college does not issue student mailboxes we can rely on, and anyone can
 * create an address on any public provider. A student ID that appears on this
 * list, and has not already been claimed, can.
 */
const StudentRoster = sequelize.define('StudentRoster', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  studentId: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  fullName: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  department: {
    type: DataTypes.ENUM(
      'Renewable Energy',
      'Mechatronic',
      'ICT',
      'Electronic and Telecommunication'
    ),
    allowNull: false,
  },
  status: {
    // A withdrawn student stays on the list but can no longer open an account.
    type: DataTypes.ENUM('Enrolled', 'Withdrawn'),
    allowNull: false,
    defaultValue: 'Enrolled',
  },
  // Set when a student successfully verifies their account, so one enrolment
  // record can never be used to open two accounts.
  claimedByEmail: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  claimedAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
});

module.exports = StudentRoster;
