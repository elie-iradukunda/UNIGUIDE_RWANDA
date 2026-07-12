const { Op } = require('sequelize');
const Reservation = require('../models/Reservation');
const Equipment = require('../models/Equipment');
const User = require('../models/User');
const sequelize = require('../config/db');
const email = require('../services/emailService');

// Notifications are sent in the background. A mail failure must never undo a
// reservation the student successfully made.
async function notifyDepartmentStaff(item, student, reservation) {
  try {
    const staff = await User.findAll({
      where: {
        role: { [Op.in]: ['Lab Staff', 'HOD'] },
        status: 'Active',
        department: item.department,
      },
    });
    staff.forEach((member) => {
      email.sendInBackground(member.email, email.templates.reservationPendingForStaff({
        staffName: member.fullName,
        studentName: student?.fullName,
        equipmentName: item.name,
        startDate: reservation.startDate,
        endDate: reservation.endDate,
      }));
    });
  } catch (error) {
    console.error(`[notify:staff] ${error.message}`);
  }
}

// Create Reservation
exports.createReservation = async (req, res) => {
  try {
    const { 
      equipmentId, 
      startDate, 
      endDate, 
      purpose, 
      moduleCode,
      studentRegNumber,
      studentIdNumber,
      studentIdImage,
      phoneNumber,
      level,
      department,
      additionalInfo
    } = req.body;
    
    const item = await Equipment.findByPk(equipmentId);

    if (req.user.role !== 'Student' || req.user.permissions?.canBorrow === false) {
      return res.status(403).json({ message: 'Only student accounts can request equipment.' });
    }
    if (!equipmentId || !purpose || !startDate || !endDate || new Date(endDate) < new Date(startDate)) {
      return res.status(400).json({ message: 'Equipment, purpose, and a valid date range are required.' });
    }
    if (!item || item.available <= 0 || item.status === 'Maintenance') {
      return res.status(400).json({ message: 'Equipment not available' });
    }

    const reservation = await Reservation.create({
      userId: req.user.id,
      equipmentId,
      startDate,
      endDate,
      purpose,
      moduleCode,
      studentRegNumber,
      studentIdNumber,
      studentIdImage,
      phoneNumber,
      level,
      department,
      additionalInfo,
      status: 'Pending'
    });

    const student = await User.findByPk(req.user.id);
    if (student?.email) {
      email.sendInBackground(student.email, email.templates.reservationSubmitted({
        fullName: student.fullName,
        equipmentName: item.name,
        startDate,
        endDate,
        purpose,
      }));
    }
    notifyDepartmentStaff(item, student, reservation);

    res.status(201).json(reservation);
  } catch (error) {
    res.status(500).json({ message: 'Reservation failed', error: error.message });
  }
};

// Get User Reservations
exports.getUserReservations = async (req, res) => {
  try {
    const reservations = await Reservation.findAll({ 
      where: { userId: req.user.id },
      include: [
        { model: Equipment, attributes: ['id', 'name', 'category', 'image', 'department', 'serialNumber', 'assetTag', 'description', 'warrantyExpiry', 'requiresMaintenance', 'manualUrl', 'videoUrls', 'galleryImages', 'modelNumber', 'supplier', 'stock', 'available', 'location'] },
        { model: User, attributes: ['id', 'fullName', 'email', 'studentId', 'role', 'department'] },
      ]
    });
    res.json(reservations);
  } catch {
    res.status(500).json({ message: 'Error fetching reservations' });
  }
};

// Manage Reservation (Approve/Reject - Admin/HOD/Lab Staff)
exports.updateReservationStatus = async (req, res) => {
  const { id } = req.params;
  const { status, reason } = req.body;
  const transaction = await sequelize.transaction();

  try {
    const reservation = await Reservation.findByPk(id, {
        include: [
          { model: Equipment, attributes: ['id', 'department', 'available', 'stock', 'status'] }
        ],
        transaction,
        lock: transaction.LOCK.UPDATE,
    });

    if (!reservation) {
      await transaction.rollback();
      return res.status(404).json({ message: 'Reservation not found' });
    }

    const transitions = {
      Pending: ['Approved', 'Cancelled'],
      Approved: ['Borrowed', 'Cancelled'],
      Borrowed: ['Returned', 'Overdue'],
      Overdue: ['Returned'],
      Returned: [],
      Cancelled: [],
    };
    if (!transitions[reservation.status]?.includes(status)) {
      await transaction.rollback();
      return res.status(409).json({ message: `Cannot change a ${reservation.status} request to ${status}.` });
    }

    const isOwnPendingCancellation = reservation.userId === req.user.id
      && reservation.status === 'Pending'
      && status === 'Cancelled';
    const isStaff = ['Admin', 'HOD', 'Lab Staff'].includes(req.user.role);
    if (!isOwnPendingCancellation && !isStaff) {
      await transaction.rollback();
      return res.status(403).json({ message: 'Role not permitted to process this reservation.' });
    }

    if (isStaff && !isOwnPendingCancellation && ['Approved', 'Cancelled'].includes(status) && !String(reason || '').trim()) {
      await transaction.rollback();
      return res.status(400).json({ message: 'A reason is required to approve or reject a request.' });
    }

    // Department Security Check: departmental staff can only process their department's equipment.
    const itemDept = reservation.Equipment?.department;
    if (!isOwnPendingCancellation && req.user.role !== 'Admin' && itemDept !== req.user.department) {
        await transaction.rollback();
        return res.status(403).json({ message: 'Unauthorized: You can only manage requests for your department.' });
    }

    const previousStatus = reservation.status;
    reservation.status = status;
    if (reason !== undefined) reservation.decisionReason = reason;
    if (status === 'Approved') {
        reservation.approvedBy = req.user.id;
    }
    if (status === 'Borrowed' && previousStatus === 'Approved') {
        const item = reservation.Equipment;
        if(item && item.available > 0) {
            item.available -= 1;
            if(item.available === 0) item.status = 'In Use'; 
            await item.save({ transaction });
        } else if (item && item.available <= 0) {
            await transaction.rollback();
            return res.status(400).json({ message: 'Item is no longer available in stock' });
        }
    } else if (status === 'Returned' && ['Borrowed', 'Overdue'].includes(previousStatus)) {
        const item = reservation.Equipment;
        if(item) {
            item.available = Math.min(Number(item.available || 0) + 1, Number(item.stock || Number.MAX_SAFE_INTEGER));
            item.status = 'Available';
            await item.save({ transaction });
        }
    }

    await reservation.save({ transaction });
    await transaction.commit();
    const updated = await Reservation.findByPk(id, {
      include: [
        { model: Equipment },
        { model: User, attributes: ['id', 'fullName', 'email', 'studentId', 'role', 'department'] },
      ],
    });

    // Tell the requester what staff decided. No email when students cancel their
    // own request, since they already know.
    if (!isOwnPendingCancellation && updated?.User?.email) {
      email.sendInBackground(updated.User.email, email.templates.reservationDecision({
        fullName: updated.User.fullName,
        equipmentName: updated.Equipment?.name || 'Equipment',
        status,
        reason: updated.decisionReason,
      }));
    }

    res.json(updated);
  } catch (error) {
    if (!transaction.finished) await transaction.rollback();
    res.status(500).json({ message: 'Update failed', error: error.message });
  }
};

// Get All Reservations (Admin/HOD/Lab Staff)
exports.getAllReservations = async (req, res) => {
  try {
    const equipmentWhere = {};

    // HOD and Lab Staff see their department; Admin sees all.
    if (req.user.role !== 'Admin' && req.user.department) {
        equipmentWhere.department = req.user.department;
    }

    const reservations = await Reservation.findAll({
      include: [
        { 
          model: Equipment, 
          attributes: ['id', 'name', 'category', 'image', 'department', 'serialNumber', 'assetTag', 'description', 'warrantyExpiry', 'requiresMaintenance', 'manualUrl', 'videoUrls', 'galleryImages', 'modelNumber', 'supplier', 'stock', 'location'],
          where: Object.keys(equipmentWhere).length > 0 ? equipmentWhere : undefined,
          required: true
        },
        { model: User, attributes: ['id', 'fullName', 'email', 'studentId', 'role', 'department'] }
      ],
      order: [['createdAt', 'DESC']]
    });
    res.json(reservations);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching all reservations', error: error.message });
  }
};
