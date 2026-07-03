const express = require('express');
const router = express.Router();
const { createAssignment, getAssignments, confirmReceipt, rejectAssignment } = require('../controllers/labAssignmentController');
const { auth, authorize } = require('../middleware/authMiddleware');

// HOD creates assignment
router.post('/', auth, authorize(['Admin', 'HOD']), createAssignment);

// Get assignments (filtered by role automatically)
router.get('/', auth, authorize(['Admin', 'HOD', 'Lab Staff']), getAssignments);

// Lab Staff confirms receipt
router.put('/:id/confirm', auth, authorize(['Admin', 'Lab Staff']), confirmReceipt);

// Lab Staff rejects assignment
router.put('/:id/reject', auth, authorize(['Admin', 'Lab Staff']), rejectAssignment);

module.exports = router;
