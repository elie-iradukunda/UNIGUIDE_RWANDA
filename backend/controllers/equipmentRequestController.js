const { EquipmentRequest, EquipmentRequestItem, User, Equipment } = require('../models');

// HOD creates a new equipment request with multiple items
exports.createRequest = async (req, res) => {
  try {
    const { items, details } = req.body; // items is an array
    
    if (req.user.role !== 'HOD' && req.user.role !== 'Admin') {
      return res.status(403).json({ message: 'Only HODs can make equipment requests' });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ message: 'Request must contain at least one item' });
    }

    const newRequest = await EquipmentRequest.create({
      requesterId: req.user.userId || req.user.id,
      department: req.user.department,
      details: details || '',
      status: 'Pending'
    });

    const itemsToCreate = items.map(item => ({
        requestId: newRequest.id,
        name: item.name,
        category: item.category,
        quantity: item.quantity,
        details: item.details || ''
    }));

    await EquipmentRequestItem.bulkCreate(itemsToCreate);

    const fullRequest = await EquipmentRequest.findByPk(newRequest.id, {
        include: [{ model: EquipmentRequestItem, as: 'Items' }]
    });

    res.status(201).json(fullRequest);
  } catch (error) {
    res.status(500).json({ message: 'Failed to create request', error: error.message });
  }
};

// Get requests
exports.getRequests = async (req, res) => {
  try {
    const isStockManager = req.user.role === 'StockManager' || req.user.role === 'Admin';
    const whereClause = {};

    if (!isStockManager) {
      whereClause.department = req.user.department;
    }

    const requests = await EquipmentRequest.findAll({
      where: whereClause,
      include: [
        { model: User, as: 'Requester', attributes: ['id', 'fullName', 'email'] },
        { model: User, as: 'Approver', attributes: ['id', 'fullName', 'email'] },
        { model: EquipmentRequestItem, as: 'Items' }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch requests', error: error.message });
  }
};

// StockManager approves
exports.approveRequest = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (req.user.role !== 'StockManager' && req.user.role !== 'Admin') {
      return res.status(403).json({ message: 'Only StockManager can approve requests' });
    }

    const request = await EquipmentRequest.findByPk(id);
    if (!request) return res.status(404).json({ message: 'Request not found' });

    request.status = 'Approved';
    request.approvedBy = req.user.userId || req.user.id;
    await request.save();

    res.json(request);
  } catch (error) {
    res.status(500).json({ message: 'Failed to approve request', error: error.message });
  }
};

// StockManager marks as delivered
exports.markAsDelivered = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (req.user.role !== 'StockManager' && req.user.role !== 'Admin') {
      return res.status(403).json({ message: 'Only StockManager can mark as delivered' });
    }

    const request = await EquipmentRequest.findByPk(id, {
        include: [{ model: EquipmentRequestItem, as: 'Items' }]
    });

    if (!request) return res.status(404).json({ message: 'Request not found' });
    if (request.status !== 'Approved') return res.status(400).json({ message: 'Request must be approved first' });

    request.status = 'Delivered';
    await request.save();

    // Create equipment records automatically for each item and its quantity
    const equipmentRecordsRow = [];
    for (const item of request.Items) {
        for (let i = 0; i < item.quantity; i++) {
            equipmentRecordsRow.push({
                name: item.name,
                category: item.category,
                department: request.department,
                description: item.details || '',
                status: 'Pending Lab Verification',
                stock: 1,
                available: 0
            });
        }
    }

    await Equipment.bulkCreate(equipmentRecordsRow);

    res.json({ message: 'Marked as delivered and sent to lab', request });
  } catch (error) {
    res.status(500).json({ message: 'Failed to mark as delivered', error: error.message });
  }
};
