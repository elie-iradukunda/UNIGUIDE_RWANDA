const { LabLocation } = require('../models');

const DEPARTMENTS = ['Renewable Energy', 'Mechatronic', 'ICT', 'Electronic and Telecommunication'];

const normalizeDepartment = (value) => {
  const aliases = {
    mechatronics: 'Mechatronic',
    mechatronic: 'Mechatronic',
    ict: 'ICT',
    it: 'ICT',
    'renewable energy': 'Renewable Energy',
    electronics: 'Electronic and Telecommunication',
    'electronic and telecommunication': 'Electronic and Telecommunication',
    'electronics and telecommunication': 'Electronic and Telecommunication',
  };
  const key = String(value || '').trim().toLowerCase();
  return aliases[key] || (DEPARTMENTS.includes(String(value || '').trim()) ? String(value).trim() : null);
};

// Accepts either a real array or newline/comma separated text from a textarea.
const toList = (value) => {
  if (Array.isArray(value)) return value.map((entry) => String(entry).trim()).filter(Boolean);
  return String(value || '')
    .split(/\r?\n|,/)
    .map((entry) => entry.trim())
    .filter(Boolean);
};

/** A Head of Department or Lab Staff may only touch laboratories in their own department. */
const canManage = (user, department) =>
  user.role === 'Admin' || (Boolean(user.department) && user.department === department);

const readPayload = (body) => ({
  name: String(body.name || '').trim(),
  department: normalizeDepartment(body.department),
  building: String(body.building || '').trim() || null,
  floor: String(body.floor || '').trim() || null,
  room: String(body.room || '').trim() || null,
  landmarks: toList(body.landmarks),
  accessibleRoute: String(body.accessibleRoute || '').trim() || null,
  accessibility: toList(body.accessibility),
  openingHours: String(body.openingHours || '').trim() || null,
  contact: String(body.contact || '').trim() || null,
});

// Public: any student, signed in or not, can find their way to a laboratory.
exports.listLabLocations = async (req, res) => {
  try {
    const labs = await LabLocation.findAll({ order: [['department', 'ASC'], ['name', 'ASC']] });
    return res.json(labs);
  } catch (error) {
    return res.status(500).json({ message: 'Laboratory guides could not be loaded.', error: error.message });
  }
};

exports.createLabLocation = async (req, res) => {
  try {
    const payload = readPayload(req.body);
    if (!payload.name) return res.status(400).json({ message: 'A laboratory name is required.' });
    if (!payload.department) {
      return res.status(400).json({ message: `Department must be one of: ${DEPARTMENTS.join(', ')}.` });
    }
    if (!canManage(req.user, payload.department)) {
      return res.status(403).json({ message: 'You can only add laboratories in your own department.' });
    }

    const lab = await LabLocation.create(payload);
    return res.status(201).json(lab);
  } catch (error) {
    return res.status(500).json({ message: 'The laboratory could not be added.', error: error.message });
  }
};

exports.updateLabLocation = async (req, res) => {
  try {
    const lab = await LabLocation.findByPk(req.params.id);
    if (!lab) return res.status(404).json({ message: 'Laboratory not found.' });
    if (!canManage(req.user, lab.department)) {
      return res.status(403).json({ message: 'You can only edit laboratories in your own department.' });
    }

    const payload = readPayload({ ...lab.toJSON(), ...req.body });
    if (!payload.name) return res.status(400).json({ message: 'A laboratory name is required.' });
    if (!payload.department) return res.status(400).json({ message: 'Unknown department.' });
    // Moving a lab into another department would put it beyond the editor's reach.
    if (!canManage(req.user, payload.department)) {
      return res.status(403).json({ message: 'You cannot move a laboratory into another department.' });
    }

    await lab.update(payload);
    return res.json(lab);
  } catch (error) {
    return res.status(500).json({ message: 'The laboratory could not be updated.', error: error.message });
  }
};

exports.deleteLabLocation = async (req, res) => {
  try {
    const lab = await LabLocation.findByPk(req.params.id);
    if (!lab) return res.status(404).json({ message: 'Laboratory not found.' });
    if (!canManage(req.user, lab.department)) {
      return res.status(403).json({ message: 'You can only remove laboratories in your own department.' });
    }
    await lab.destroy();
    return res.json({ message: 'Laboratory guide removed.' });
  } catch (error) {
    return res.status(500).json({ message: 'The laboratory could not be removed.', error: error.message });
  }
};
