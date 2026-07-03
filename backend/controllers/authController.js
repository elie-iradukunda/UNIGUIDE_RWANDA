const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const generateToken = (user) => {
  return jwt.sign({ 
    id: user.id, 
    role: user.role, 
    department: user.department,
    permissions: {
      canBorrow: user.canBorrow,
      canReserve: user.canReserve,
      canViewReports: user.canViewReports
    }
  }, process.env.JWT_SECRET, {
    expiresIn: '7d',
  });
};

exports.register = async (req, res) => {
  try {
    const { 
      fullName, email, password, role, department, studentId
    } = req.body; // Full frontend integration
    
    if (!fullName || !email || !password || password.length < 8) {
      return res.status(400).json({ message: 'Name, email, and an 8-character password are required.' });
    }
    const publicRole = ['Student', 'Lecturer'].includes(role) ? role : 'Student';

    // Check if user exists
    let user = await User.findOne({ where: { email } });
    if (user) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    user = await User.create({
      fullName,
      email,
      password: hashedPassword,
      role: publicRole,
      department,
      studentId: publicRole === 'Student' ? studentId : null,
      avatar: `https://ui-avatars.com/api/?name=${fullName}&background=1f4fa3&color=fff`,
      canBorrow: true,
      canReserve: true,
      canViewReports: false,
      status: 'Active',
    });

    const token = generateToken(user);

    res.status(201).json({ token, user: { id: user.id, fullName, email, role: publicRole, department, avatar: user.avatar } });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const user = await User.findOne({ where: { email } });
    if (!user || user.status !== 'Active') {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = generateToken(user);

    res.json({ token, user: { id: user.id, fullName: user.fullName, email, role: user.role, department: user.department, avatar: user.avatar } });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getMe = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, { attributes: { exclude: ['password'] } });
    res.json(user);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateMe = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user || user.status !== 'Active') return res.status(404).json({ message: 'Active account not found.' });
    const fullName = String(req.body.fullName || user.fullName).trim();
    const email = String(req.body.email || user.email).trim().toLowerCase();
    if (!fullName || !email) return res.status(400).json({ message: 'Name and email are required.' });
    const existing = await User.findOne({ where: { email } });
    if (existing && existing.id !== user.id) return res.status(409).json({ message: 'Email is already in use.' });
    await user.update({ fullName, email });
    const safeUser = user.toJSON();
    delete safeUser.password;
    return res.json(safeUser);
  } catch (error) {
    return res.status(400).json({ message: 'Profile could not be updated.', error: error.message });
  }
};
