const express = require('express');
const router = express.Router();
const { Announcement, User } = require('../models');
const { auth, authorize } = require('../middleware/authMiddleware');

// Get all announcements
router.get('/', async (req, res) => {
  try {
    const announcements = await Announcement.findAll({
      order: [['createdAt', 'DESC']]
    });
    res.json(announcements);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Create announcement
router.post('/', auth, authorize(['Admin', 'HOD', 'Lab Staff']), async (req, res) => {
  try {
    const { title, content, department } = req.body;
    if (!title || !content) return res.status(400).json({ message: 'Title and content are required.' });
    const author = await User.findByPk(req.user.id, { attributes: ['fullName'] });
    
    const newAnnouncement = await Announcement.create({
      title,
      content,
      department: department || 'All Departments',
      authorName: author?.fullName || req.user.role,
      authorId: req.user.id
    });
    
    res.json(newAnnouncement);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Delete announcement
router.delete('/:id', auth, authorize(['Admin', 'HOD']), async (req, res) => {
  try {
    const announcement = await Announcement.findByPk(req.params.id);
    if (!announcement) {
      return res.status(404).json({ msg: 'Announcement not found' });
    }
    
    await announcement.destroy();
    res.json({ msg: 'Announcement removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
