const { Op } = require('sequelize');
const { StudentRoster, User } = require('../models');

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

exports.listRoster = async (req, res) => {
  try {
    const search = String(req.query.search || '').trim();
    const where = search
      ? {
        [Op.or]: [
          { studentId: { [Op.like]: `%${search}%` } },
          { fullName: { [Op.like]: `%${search}%` } },
        ],
      }
      : {};

    const entries = await StudentRoster.findAll({ where, order: [['studentId', 'ASC']], limit: 500 });
    return res.json({
      entries,
      total: await StudentRoster.count(),
      claimed: await StudentRoster.count({ where: { claimedAt: { [Op.ne]: null } } }),
      departments: DEPARTMENTS,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Could not load the enrolment list.', error: error.message });
  }
};

exports.addEntry = async (req, res) => {
  try {
    const studentId = String(req.body.studentId || '').trim();
    const department = normalizeDepartment(req.body.department);
    if (!studentId) return res.status(400).json({ message: 'A student ID is required.' });
    if (!department) {
      return res.status(400).json({ message: `Department must be one of: ${DEPARTMENTS.join(', ')}.` });
    }

    const existing = await StudentRoster.findOne({ where: { studentId } });
    if (existing) return res.status(409).json({ message: 'That student ID is already on the list.' });

    const entry = await StudentRoster.create({
      studentId,
      fullName: String(req.body.fullName || '').trim() || null,
      department,
      status: 'Enrolled',
    });
    return res.status(201).json(entry);
  } catch (error) {
    return res.status(500).json({ message: 'Could not add the student.', error: error.message });
  }
};

/**
 * Bulk load from the registry export. Accepts either a JSON array of
 * {studentId, fullName, department} or raw CSV text with those columns.
 *
 * Rows are reported individually rather than failing the whole import, so one bad
 * line in a thousand-row export does not discard the other 999.
 */
exports.importRoster = async (req, res) => {
  try {
    let rows = req.body.entries;

    if (!Array.isArray(rows) && typeof req.body.csv === 'string') {
      const lines = req.body.csv.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
      if (lines.length && /student\s*id/i.test(lines[0])) lines.shift(); // drop a header row
      rows = lines.map((line) => {
        const [studentId, fullName, department] = line.split(',').map((cell) => (cell || '').trim());
        return { studentId, fullName, department };
      });
    }

    if (!Array.isArray(rows) || !rows.length) {
      return res.status(400).json({ message: 'Provide the students as CSV text or a JSON array.' });
    }

    const added = [];
    const updated = [];
    const skipped = [];

    for (const row of rows) {
      const studentId = String(row.studentId || '').trim();
      const department = normalizeDepartment(row.department);
      const fullName = String(row.fullName || '').trim() || null;

      if (!studentId) {
        skipped.push({ row, reason: 'Missing student ID.' });
        continue;
      }
      if (!department) {
        skipped.push({ studentId, reason: `Unknown department "${row.department || ''}".` });
        continue;
      }

      const existing = await StudentRoster.findOne({ where: { studentId } });
      if (existing) {
        // Never overwrite a claimed record: the account is already live.
        if (existing.claimedAt) {
          skipped.push({ studentId, reason: 'Already claimed by a registered student.' });
          continue;
        }
        await existing.update({ fullName, department });
        updated.push(studentId);
        continue;
      }

      await StudentRoster.create({ studentId, fullName, department, status: 'Enrolled' });
      added.push(studentId);
    }

    return res.status(201).json({
      message: `${added.length} added, ${updated.length} updated, ${skipped.length} skipped.`,
      added: added.length,
      updated: updated.length,
      skipped,
      total: await StudentRoster.count(),
    });
  } catch (error) {
    return res.status(500).json({ message: 'Import failed.', error: error.message });
  }
};

exports.updateEntry = async (req, res) => {
  try {
    const entry = await StudentRoster.findByPk(req.params.id);
    if (!entry) return res.status(404).json({ message: 'Student not found on the list.' });

    const changes = {};
    if (req.body.fullName !== undefined) changes.fullName = String(req.body.fullName).trim() || null;
    if (req.body.department !== undefined) {
      const department = normalizeDepartment(req.body.department);
      if (!department) return res.status(400).json({ message: 'Unknown department.' });
      changes.department = department;
    }
    if (req.body.status !== undefined) {
      if (!['Enrolled', 'Withdrawn'].includes(req.body.status)) {
        return res.status(400).json({ message: 'Status must be Enrolled or Withdrawn.' });
      }
      changes.status = req.body.status;
    }

    await entry.update(changes);
    return res.json(entry);
  } catch (error) {
    return res.status(500).json({ message: 'Could not update the student.', error: error.message });
  }
};

/** Release a claim so a student who lost access can register again. */
exports.releaseEntry = async (req, res) => {
  try {
    const entry = await StudentRoster.findByPk(req.params.id);
    if (!entry) return res.status(404).json({ message: 'Student not found on the list.' });
    if (!entry.claimedAt) return res.status(400).json({ message: 'That record has not been claimed.' });

    // The account itself must go too, or its unique student ID blocks the re-registration.
    await User.destroy({ where: { studentId: entry.studentId } });
    await entry.update({ claimedByEmail: null, claimedAt: null });

    return res.json({ message: 'The student ID can be registered again.', entry });
  } catch (error) {
    return res.status(500).json({ message: 'Could not release the student ID.', error: error.message });
  }
};

exports.deleteEntry = async (req, res) => {
  try {
    const entry = await StudentRoster.findByPk(req.params.id);
    if (!entry) return res.status(404).json({ message: 'Student not found on the list.' });
    if (entry.claimedAt) {
      return res.status(409).json({
        message: 'That student has an active account. Mark them Withdrawn instead, or release the ID first.',
      });
    }
    await entry.destroy();
    return res.json({ message: 'Removed from the enrolment list.' });
  } catch (error) {
    return res.status(500).json({ message: 'Could not remove the student.', error: error.message });
  }
};
