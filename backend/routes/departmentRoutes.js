const express = require('express');
const { auth, authorize } = require('../middleware/authMiddleware');
const controller = require('../controllers/departmentController');

const router = express.Router();

router.get('/', auth, authorize(['Admin', 'HOD']), controller.listDepartments);
router.post('/', auth, authorize(['Admin']), controller.createDepartment);
router.patch('/:id', auth, authorize(['Admin']), controller.updateDepartment);
router.delete('/:id', auth, authorize(['Admin']), controller.deleteDepartment);

module.exports = router;
