const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    const value = req.header('Authorization') || '';
    if (!value.startsWith('Bearer ')) throw new Error('Missing bearer token');
    const token = value.slice(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const account = await User.findByPk(decoded.id, { attributes: ['id', 'role', 'department', 'status', 'canBorrow', 'canReserve', 'canViewReports'] });
    if (!account || account.status !== 'Active') throw new Error('Account is inactive');
    req.user = {
      id: account.id,
      role: account.role,
      department: account.department,
      permissions: {
        canBorrow: account.canBorrow,
        canReserve: account.canReserve,
        canViewReports: account.canViewReports,
      },
    };
    next();
  } catch {
    res.status(401).send({ error: 'Please authenticate.' });
  }
};

const authorize = (roles = []) => {
  if (typeof roles === 'string') {
    roles = [roles];
  }

  return (req, res, next) => {
    if (roles.length && !roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    next();
  };
};

module.exports = { auth, authorize };
