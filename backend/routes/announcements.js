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

const optionalAuth = (req, res, next) => {
  const authHeader = req.header('Authorization');
  if (authHeader) return auth(req, res, next);
  req.user = null;
  return next();
};

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
router.get('/', optionalAuth, async (req, res) => {
  try {
    const where = {};
    if (req.user?.department && ['Student', 'HOD', 'Lab Staff'].includes(req.user.role)) {
      where.department = { [Op.in]: ['All Departments', req.user.department] };
    }

    const announcements = await Announcement.findAll({
      where,
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
    const targetDepartment = ['HOD', 'Lab Staff'].includes(req.user.role)
      ? req.user.department
      : department || 'All Departments';
    
    const newAnnouncement = await Announcement.create({
      title,
      content,
      department: targetDepartment || 'All Departments',
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
    if (req.user.role === 'HOD' && announcement.department !== req.user.department) {
      return res.status(403).json({ message: 'You can only remove announcements from your department.' });
    }
    
    await announcement.destroy();
    res.json({ msg: 'Announcement removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
