const express = require('express');
const router = express.Router();
const equipmentRequestController = require('../controllers/equipmentRequestController');
const { auth } = require('../middleware/authMiddleware');

router.post('/', auth, equipmentRequestController.createRequest);
router.get('/', auth, equipmentRequestController.getRequests);
router.put('/:id/approve', auth, equipmentRequestController.approveRequest);
router.put('/:id/deliver', auth, equipmentRequestController.markAsDelivered);

module.exports = router;
