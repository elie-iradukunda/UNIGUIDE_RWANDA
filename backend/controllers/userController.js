const User = require('../models/User');
const bcrypt = require('bcryptjs');

// Get all users (Admin only)
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: { exclude: ['password'] },
      order: [['createdAt', 'DESC']]
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching users', error: error.message });
  }
};

// Get Lab Staff users, optionally filtered by department (HOD + Admin)
exports.getLabStaff = async (req, res) => {
  try {
    const { department } = req.query;
    const whereClause = { role: 'Lab Staff', status: 'Active' };
    if (department) whereClause.department = department;

    const labStaff = await User.findAll({
      where: whereClause,
      attributes: ['id', 'fullName', 'email', 'department', 'avatar'],
      order: [['fullName', 'ASC']]
    });
    res.json(labStaff);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching lab staff', error: error.message });
  }
};

// Create a new user (Admin only)
exports.createUser = async (req, res) => {
  try {
    const { fullName, email, password, role, department, studentId, canBorrow, canReserve, canViewReports } = req.body;

    // Check if user already exists
    const userExists = await User.findOne({ where: { email } });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password || 'TemporaryPassword123!', salt);

    const newUser = await User.create({
      fullName,
      email,
      password: hashedPassword,
      role,
      department,
      studentId,
      canBorrow,
      canReserve,
      canViewReports
    });

    const { password: _, ...userWithoutPassword } = newUser.toJSON();
    res.status(201).json(userWithoutPassword);
  } catch (error) {
    res.status(400).json({ message: 'Error creating user', error: error.message });
  }
};

// Update user (Admin only)
exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByPk(id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const updateData = { ...req.body };
    // Don't update password here for simplicity
    delete updateData.password;

    await user.update(updateData);
    const safeUser = user.toJSON();
    delete safeUser.password;
    res.json(safeUser);
  } catch (error) {
    res.status(500).json({ message: 'Update failed', error: error.message });
  }
};

// Deactivate user (Soft Delete - Admin only)
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByPk(id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent self-deactivation
    if (user.id === req.user.id) {
        return res.status(400).json({ message: 'You cannot deactivate your own account' });
    }

    // Instead of destroy, we change status to Inactive
    await user.update({ status: 'Inactive' });
    const safeUser = user.toJSON();
    delete safeUser.password;
    res.json({ message: 'User deactivated successfully', user: safeUser });
  } catch (error) {
    res.status(500).json({ message: 'Deactivation failed', error: error.message });
  }
};
