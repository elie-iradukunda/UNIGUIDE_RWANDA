const { Op } = require('sequelize');
const { Department, Equipment, User } = require('../models');

const departmentAliases = (name) => {
  const aliases = {
    Mechatronics: ['Mechatronics', 'Mechatronic'],
    Mechatronic: ['Mechatronics', 'Mechatronic'],
    'Electronics and Telecommunication': ['Electronics and Telecommunication', 'Electronic and Telecommunication', 'Electronics'],
    'Electronic and Telecommunication': ['Electronics and Telecommunication', 'Electronic and Telecommunication', 'Electronics'],
  };
  return aliases[name] || [name];
};

const withCounts = async (department) => {
  const aliases = departmentAliases(department.name);
  const [users, equipment] = await Promise.all([
    User.count({ where: { department: { [Op.in]: aliases } } }),
    Equipment.sum('stock', { where: { department: { [Op.in]: aliases } } }),
  ]);
  return { ...department.toJSON(), users, equipment: Number(equipment || 0) };
};

exports.listDepartments = async (req, res) => {
  try {
    const rows = await Department.findAll({ order: [['name', 'ASC']] });
    return res.json(await Promise.all(rows.map(withCounts)));
  } catch (error) {
    return res.status(500).json({ message: 'Unable to load departments.', error: error.message });
  }
};

exports.createDepartment = async (req, res) => {
  try {
    const name = String(req.body.name || '').trim();
    const lead = String(req.body.lead || '').trim();
    if (!name || !lead) return res.status(400).json({ message: 'Department name and lead are required.' });
    const [department, created] = await Department.findOrCreate({
      where: { name },
      defaults: { name, lead, activeLabs: Number(req.body.activeLabs || 0), status: req.body.status || 'Active' },
    });
    if (!created) return res.status(409).json({ message: 'Department already exists.' });
    return res.status(201).json(await withCounts(department));
  } catch (error) {
    return res.status(400).json({ message: 'Unable to create department.', error: error.message });
  }
};

exports.updateDepartment = async (req, res) => {
  try {
    const department = await Department.findByPk(req.params.id);
    if (!department) return res.status(404).json({ message: 'Department not found.' });
    const allowed = ['name', 'lead', 'activeLabs', 'status'];
    const changes = Object.fromEntries(allowed.filter((key) => Object.hasOwn(req.body, key)).map((key) => [key, req.body[key]]));
    if (Object.hasOwn(changes, 'activeLabs')) changes.activeLabs = Number(changes.activeLabs || 0);
    await department.update(changes);
    return res.json(await withCounts(department));
  } catch (error) {
    return res.status(400).json({ message: 'Unable to update department.', error: error.message });
  }
};

exports.deleteDepartment = async (req, res) => {
  try {
    const department = await Department.findByPk(req.params.id);
    if (!department) return res.status(404).json({ message: 'Department not found.' });
    await department.update({ status: 'Inactive' });
    return res.json({ message: 'Department deactivated.', department: await withCounts(department) });
  } catch (error) {
    return res.status(500).json({ message: 'Unable to deactivate department.', error: error.message });
  }
};
