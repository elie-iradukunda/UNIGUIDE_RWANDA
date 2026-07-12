const express = require('express');
const router = express.Router();
const { getAllEquipment, getEquipmentById, getEquipmentQr, createEquipment, updateEquipment, deleteEquipment, verifyEquipment } = require('../controllers/equipmentController');
const { auth, authorize } = require('../middleware/authMiddleware');

router.get('/', (req, res, next) => {
    const authHeader = req.header('Authorization');
    if (authHeader) {
        return auth(req, res, next);
    }
    req.user = null; // Public user
    next();
}, getAllEquipment);
router.get('/:id', getEquipmentById);
router.get('/:id/qr', getEquipmentQr);
router.post('/', auth, authorize(['Admin', 'HOD', 'Lab Staff']), createEquipment);
router.put('/:id', auth, authorize(['Admin', 'HOD', 'Lab Staff']), updateEquipment);
router.put('/:id/verify', auth, authorize(['Admin', 'HOD', 'Lab Staff']), verifyEquipment);
router.delete('/:id', auth, authorize(['Admin']), deleteEquipment);

module.exports = router;
