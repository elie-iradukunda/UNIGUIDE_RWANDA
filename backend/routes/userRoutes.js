const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { auth, authorize } = require('../middleware/authMiddleware');

// All user management routes are protected: Admin only.
router.get('/', auth, authorize(['Admin']), userController.getAllUsers);
// Lab Staff lookup - accessible by Admin and HOD for assignment.
router.get('/lab-staff', auth, authorize(['Admin', 'HOD']), userController.getLabStaff);
router.post('/', auth, authorize(['Admin']), userController.createUser);
router.post('/:id/email', auth, authorize(['Admin']), userController.emailUser);
router.put('/:id', auth, authorize(['Admin']), userController.updateUser);
router.patch('/:id', auth, authorize(['Admin']), userController.updateUser);
router.delete('/:id', auth, authorize(['Admin']), userController.deleteUser);

module.exports = router;
