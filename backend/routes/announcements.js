const express = require('express');
const { Op } = require('sequelize');
const router = express.Router();
const { Announcement, User } = require('../models');
const { auth, authorize } = require('../middleware/authMiddleware');
const email = require('../services/emailService');

// A published notice is emailed to the students it concerns. The cap is a safety net:
// the mail provider's free tier is a few hundred messages a day, and one careless
// "All Departments" notice should not exhaust it and silently drop the OTPs students
// need in order to register.
const RECIPIENT_LIMIT = Number(process.env.ANNOUNCEMENT_EMAIL_LIMIT || 200);

async function emailAnnouncement(announcement) {
  try {
    const where = { role: 'Student', status: 'Active' };
    if (announcement.department && announcement.department !== 'All Departments') {
      where.department = announcement.department;
    }

    const students = await User.findAll({
      where: { ...where, email: { [Op.ne]: null } },
      attributes: ['email'],
      limit: RECIPIENT_LIMIT,
    });

    const message = email.templates.announcement({
      title: announcement.title,
      content: announcement.content,
      department: announcement.department,
      authorName: announcement.authorName,
    });

    students.forEach((student) => email.sendInBackground(student.email, message));
    console.info(`[announcement] "${announcement.title}" queued to ${students.length} student(s).`);
  } catch (error) {
    // Never fail the publish because the mail provider is unhappy.
    console.error(`[announcement:email] ${error.message}`);
  }
}

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

    emailAnnouncement(newAnnouncement);

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
