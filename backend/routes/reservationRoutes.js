const express = require('express');
const router = express.Router();
const reservationController = require('../controllers/reservationController');
const { auth, authorize } = require('../middleware/authMiddleware');

router.post('/', auth, reservationController.createReservation);
router.get('/my', auth, reservationController.getUserReservations);
router.get('/all', auth, authorize(['Admin', 'HOD', 'Lab Staff']), reservationController.getAllReservations);
router.put('/:id', auth, reservationController.updateReservationStatus);
router.patch('/:id', auth, reservationController.updateReservationStatus);

module.exports = router;
