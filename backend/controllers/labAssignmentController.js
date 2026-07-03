const LabAssignment = require('../models/LabAssignment');
const Equipment = require('../models/Equipment');
const User = require('../models/User');

// HOD creates an assignment to Lab Staff
exports.createAssignment = async (req, res) => {
  try {
    const { equipmentId, equipmentName, quantity, labLocation, assignedToId, assignedToName, notes } = req.body;

    if (!equipmentId || !assignedToId || !labLocation || !quantity) {
      return res.status(400).json({ message: 'Missing required fields: equipmentId, assignedToId, labLocation, quantity' });
    }

    // Update equipment status
    const equipment = await Equipment.findByPk(equipmentId);
    if (!equipment) return res.status(404).json({ message: 'Equipment not found' });

    // Get assigner's name
    const assigner = await User.findByPk(req.user.id, { attributes: ['fullName'] });

    const assignment = await LabAssignment.create({
      equipmentId,
      equipmentName: equipmentName || equipment.name,
      quantity: parseInt(quantity),
      labLocation,
      assignedById: req.user.id,
      assignedByName: assigner?.fullName || 'HOD',
      assignedToId,
      assignedToName,
      department: req.user.department || equipment.department,
      notes,
      status: 'Pending'
    });

    // Update equipment status to assigned
    await equipment.update({
      status: 'Assigned to Lab',
      location: labLocation
    });

    res.status(201).json({ message: 'Equipment assigned successfully', assignment });
  } catch (error) {
    console.error('Create assignment error:', error);
    res.status(500).json({ message: 'Failed to create assignment', error: error.message });
  }
};

// Get assignments - filtered by role
exports.getAssignments = async (req, res) => {
  try {
    let whereClause = {};

    if (req.user.role === 'Lab Staff') {
      // Lab Staff sees only assignments sent TO them
      whereClause.assignedToId = req.user.id;
    } else if (req.user.role === 'HOD') {
      // HOD sees assignments THEY created
      whereClause.assignedById = req.user.id;
    }
    // Admin sees all

    const assignments = await LabAssignment.findAll({
      where: whereClause,
      order: [['createdAt', 'DESC']]
    });

    res.json(assignments);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch assignments', error: error.message });
  }
};

// Lab Staff confirms receipt
exports.confirmReceipt = async (req, res) => {
  try {
    const { id } = req.params;
    const assignment = await LabAssignment.findByPk(id);

    if (!assignment) return res.status(404).json({ message: 'Assignment not found' });

    // Only the assigned Lab Staff can confirm
    const userId = req.user.id;
    if (req.user.role !== 'Admin' && assignment.assignedToId !== userId) {
      return res.status(403).json({ message: 'Only the assigned technician can confirm receipt' });
    }

    assignment.status = 'Received';
    assignment.receivedAt = new Date();
    await assignment.save();

    // Update equipment to Available
    const equipment = await Equipment.findByPk(assignment.equipmentId);
    if (equipment) {
      await equipment.update({
        status: 'Available',
        available: assignment.quantity,
        location: assignment.labLocation
      });
    }

    res.json({ message: 'Receipt confirmed. Equipment is now available.', assignment });
  } catch (error) {
    res.status(500).json({ message: 'Failed to confirm receipt', error: error.message });
  }
};

// Lab Staff rejects assignment
exports.rejectAssignment = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const assignment = await LabAssignment.findByPk(id);

    if (!assignment) return res.status(404).json({ message: 'Assignment not found' });

    const userId = req.user.id;
    if (req.user.role !== 'Admin' && assignment.assignedToId !== userId) {
      return res.status(403).json({ message: 'Only the assigned technician can reject' });
    }

    assignment.status = 'Rejected';
    assignment.notes = reason || assignment.notes;
    await assignment.save();

    // Revert equipment status
    const equipment = await Equipment.findByPk(assignment.equipmentId);
    if (equipment) {
      await equipment.update({ status: 'Available' });
    }

    res.json({ message: 'Assignment rejected.', assignment });
  } catch (error) {
    res.status(500).json({ message: 'Failed to reject assignment', error: error.message });
  }
};
