const User = require('./User');
const Equipment = require('./Equipment');
const Reservation = require('./Reservation');
const EquipmentRequest = require('./EquipmentRequest');
const EquipmentRequestItem = require('./EquipmentRequestItem');
const LabAssignment = require('./LabAssignment');
const Announcement = require('./Announcement');
const Department = require('./Department');

// Relationships
User.hasMany(Reservation, { foreignKey: 'userId' });
Reservation.belongsTo(User, { foreignKey: 'userId' });

Equipment.hasMany(Reservation, { foreignKey: 'equipmentId' });
Reservation.belongsTo(Equipment, { foreignKey: 'equipmentId' });

User.hasMany(EquipmentRequest, { foreignKey: 'requesterId' });
EquipmentRequest.belongsTo(User, { foreignKey: 'requesterId', as: 'Requester' });
EquipmentRequest.belongsTo(User, { foreignKey: 'approvedBy', as: 'Approver' });

EquipmentRequest.hasMany(EquipmentRequestItem, { foreignKey: 'requestId', as: 'Items' });
EquipmentRequestItem.belongsTo(EquipmentRequest, { foreignKey: 'requestId' });

module.exports = {
  User,
  Equipment,
  Reservation,
  EquipmentRequest,
  EquipmentRequestItem,
  LabAssignment,
  Announcement,
  Department
};
