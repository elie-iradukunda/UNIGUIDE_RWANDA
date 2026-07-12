const express = require('express');
const router = express.Router();
const roster = require('../controllers/rosterController');
const { auth, authorize } = require('../middleware/authMiddleware');

// The enrolment list decides who may open an account, so only administrators may
// change it. Heads of Department may read it to check their own students.
router.get('/', auth, authorize(['Admin', 'HOD']), roster.listRoster);
router.post('/', auth, authorize(['Admin']), roster.addEntry);
router.post('/import', auth, authorize(['Admin']), roster.importRoster);
router.patch('/:id', auth, authorize(['Admin']), roster.updateEntry);
router.post('/:id/release', auth, authorize(['Admin']), roster.releaseEntry);
router.delete('/:id', auth, authorize(['Admin']), roster.deleteEntry);

module.exports = router;
