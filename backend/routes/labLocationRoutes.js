const express = require('express');
const router = express.Router();
const controller = require('../controllers/labLocationController');
const { auth, authorize } = require('../middleware/authMiddleware');

// Reading is public: a student must be able to find a laboratory before signing in,
// and the accessible route is exactly the sort of thing somebody looks up on arrival.
router.get('/', controller.listLabLocations);

// Writing is for staff. The controller further restricts HOD and Lab Staff to their
// own department, so ICT staff cannot rewrite the directions to a Mechatronic lab.
router.post('/', auth, authorize(['Admin', 'HOD', 'Lab Staff']), controller.createLabLocation);
router.put('/:id', auth, authorize(['Admin', 'HOD', 'Lab Staff']), controller.updateLabLocation);
router.patch('/:id', auth, authorize(['Admin', 'HOD', 'Lab Staff']), controller.updateLabLocation);
router.delete('/:id', auth, authorize(['Admin', 'HOD', 'Lab Staff']), controller.deleteLabLocation);

module.exports = router;
