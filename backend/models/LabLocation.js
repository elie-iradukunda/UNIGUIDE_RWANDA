const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

/**
 * A laboratory and the directions to reach it.
 *
 * These used to be a hardcoded array in data/demoStore, served straight from
 * server.js even when running on MySQL, so staff could not add or correct a
 * laboratory without a code change. They are records now.
 */
const LabLocation = sequelize.define('LabLocation', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
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
  building: { type: DataTypes.STRING, allowNull: true },
  floor: { type: DataTypes.STRING, allowNull: true },
  room: { type: DataTypes.STRING, allowNull: true },

  // Turn-by-turn cues a student can follow while walking.
  landmarks: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: [],
  },
  // The step-free way in. Kept separate from landmarks because a student who needs
  // it must not have to read the whole route to find out whether they can get there.
  accessibleRoute: { type: DataTypes.TEXT, allowNull: true },
  accessibility: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: [],
  },

  openingHours: { type: DataTypes.STRING, allowNull: true },
  contact: { type: DataTypes.STRING, allowNull: true },
});

module.exports = LabLocation;
