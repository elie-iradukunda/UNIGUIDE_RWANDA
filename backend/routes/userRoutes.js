const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { auth, authorize } = require('../middleware/authMiddleware');

// All user management routes are protected: Admin only
router.get('/', auth, authorize(['Admin', 'IT Support']), userController.getAllUsers);
// Lab Staff lookup - accessible by HOD and Admin for assignment
router.get('/lab-staff', auth, authorize(['Admin', 'HOD']), userController.getLabStaff);
router.post('/', auth, authorize(['Admin', 'IT Support']), userController.createUser);
router.put('/:id', auth, authorize(['Admin', 'IT Support']), userController.updateUser);
router.patch('/:id', auth, authorize(['Admin', 'IT Support']), userController.updateUser);
router.delete('/:id', auth, authorize(['Admin', 'IT Support']), userController.deleteUser);

module.exports = router;
