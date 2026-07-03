const Reservation = require('../models/Reservation');
const Equipment = require('../models/Equipment');
const User = require('../models/User');
const sequelize = require('../config/db');

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

    if (!['Student', 'Lecturer', 'HOD'].includes(req.user.role) || req.user.permissions?.canBorrow === false) {
      return res.status(403).json({ message: 'This account is not permitted to borrow equipment.' });
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

// Manage Reservation (Approve/Reject - HOD/StockManager/LabStaff)
exports.updateReservationStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body; 
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
    const isStaff = ['Admin', 'HOD', 'StockManager', 'Lab Staff'].includes(req.user.role);
    if (!isOwnPendingCancellation && !isStaff) {
      await transaction.rollback();
      return res.status(403).json({ message: 'Role not permitted to process this reservation.' });
    }

    // Department Security Check: departmental staff can only process their department's equipment.
    const itemDept = reservation.Equipment?.department;
    if (!isOwnPendingCancellation && !['Admin', 'StockManager'].includes(req.user.role) && itemDept !== req.user.department) {
        await transaction.rollback();
        return res.status(403).json({ message: 'Unauthorized: You can only manage requests for your department.' });
    }

    const previousStatus = reservation.status;
    reservation.status = status;
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
    res.json(updated);
  } catch (error) {
    if (!transaction.finished) await transaction.rollback();
    res.status(500).json({ message: 'Update failed', error: error.message });
  }
};

// Get All Reservations (Admin/Staff)
exports.getAllReservations = async (req, res) => {
  try {
    const equipmentWhere = {};

    // For Departmental Staff (HOD, StockManager, Lab Staff), filter by their department
    if (!['Admin', 'StockManager'].includes(req.user.role) && req.user.department) {
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
