const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const QRCode = require('qrcode');
const emailService = require('../services/emailService');
const mailConfig = require('../config/mail');

// The presentation store keeps its own in-memory OTP list so the offline demo runs
// the same registration flow as the database path, without needing MySQL.
const demoOtps = new Map();

const isAllowedStudentEmail = (address) =>
  mailConfig.studentEmailDomains.includes(String(address || '').split('@')[1] || '');

function issueDemoOtp(address, purpose) {
  const code = String(crypto.randomInt(0, 1000000)).padStart(6, '0');
  demoOtps.set(`${address}:${purpose}`, {
    code,
    expiresAt: Date.now() + mailConfig.otpTtlMinutes * 60 * 1000,
    attempts: 0,
  });
  return code;
}

function verifyDemoOtp(address, purpose, submitted) {
  const key = `${address}:${purpose}`;
  const record = demoOtps.get(key);
  if (!record) return { ok: false, message: 'No verification code is pending. Request a new one.' };
  if (record.expiresAt < Date.now()) {
    demoOtps.delete(key);
    return { ok: false, message: 'That code has expired. Request a new one.' };
  }
  if (record.attempts >= mailConfig.otpMaxAttempts) {
    demoOtps.delete(key);
    return { ok: false, message: 'Too many incorrect attempts. Request a new code.' };
  }
  if (record.code !== String(submitted || '').trim()) {
    record.attempts += 1;
    const left = mailConfig.otpMaxAttempts - record.attempts;
    return {
      ok: false,
      message: left > 0 ? `Incorrect code. ${left} attempt${left === 1 ? '' : 's'} remaining.` : 'Too many incorrect attempts. Request a new code.',
    };
  }
  demoOtps.delete(key);
  return { ok: true };
}

// The departments a student may belong to. Must match the User/StudentRoster enums.
const demoDepartments = ['Renewable Energy', 'Mechatronic', 'ICT', 'Electronic and Telecommunication'];

let nextLab = 5;

// Landmarks and accessibility features arrive either as an array or as the raw text of
// a textarea, one entry per line.
const toDemoList = (value) => {
  if (Array.isArray(value)) return value.map((entry) => String(entry).trim()).filter(Boolean);
  return String(value || '').split(/\r?\n|,/).map((entry) => entry.trim()).filter(Boolean);
};

// The offline mirror of the college enrolment list. Registration checks the student
// ID against this, exactly as the database path checks the StudentRoster table.
const roster = [
  { id: 'rst-001', studentId: 'STU-2026-014', fullName: 'Jean Uwimana', department: 'Mechatronic', status: 'Enrolled', claimedByEmail: 'student@uniguide.rw', claimedAt: '2026-06-29T08:00:00.000Z' },
  { id: 'rst-002', studentId: 'STU-2026-015', fullName: 'Aline Mukamana', department: 'ICT', status: 'Enrolled', claimedByEmail: null, claimedAt: null },
  { id: 'rst-003', studentId: 'STU-2026-016', fullName: 'Patrick Habimana', department: 'Renewable Energy', status: 'Enrolled', claimedByEmail: null, claimedAt: null },
  { id: 'rst-004', studentId: 'STU-2026-017', fullName: 'Chantal Ingabire', department: 'Electronic and Telecommunication', status: 'Enrolled', claimedByEmail: null, claimedAt: null },
  { id: 'rst-005', studentId: 'STU-2025-088', fullName: 'Former Student', department: 'ICT', status: 'Withdrawn', claimedByEmail: null, claimedAt: null },
];
let nextRoster = 6;

const now = '2026-06-29T08:00:00.000Z';
let nextUser = 5;
let nextEquipment = 7;
let nextReservation = 7;
let nextAnnouncement = 5;

const users = [
  { id: 'usr-001', fullName: 'Jean Uwimana', email: 'student@uniguide.rw', password: 'password123', role: 'Student', department: 'Mechatronic', studentId: 'STU-2026-014', status: 'Active', canBorrow: true, canReserve: true, canViewReports: false },
  { id: 'usr-002', fullName: 'Iradukunda David', email: 'hod@uniguide.rw', password: 'password123', role: 'HOD', department: 'Mechatronic', studentId: 'HOD-002', status: 'Active', canBorrow: false, canReserve: false, canViewReports: true },
  { id: 'usr-003', fullName: 'Eric Niyonsaba', email: 'labstaff@uniguide.rw', password: 'password123', role: 'Lab Staff', department: 'Mechatronic', studentId: 'TECH-018', status: 'Active', canBorrow: false, canReserve: false, canViewReports: false },
  { id: 'usr-004', fullName: 'Mukandanga Claire', email: 'admin@uniguide.rw', password: 'password123', role: 'Admin', department: 'ICT', studentId: 'ADM-004', status: 'Active', canBorrow: false, canReserve: false, canViewReports: true },
];

const equipment = [
  { id: 'osc-001', name: 'Oscilloscope', assetTag: 'OSC-001', modelNumber: 'Rigol DS1054Z', serialNumber: 'RW-OSC-2026-001', category: 'Electronics', department: 'Mechatronic', location: 'Engineering Block, Floor 1, Electronics Lab 2, Bench E-04', status: 'Available', available: 4, stock: 5, image: 'https://images.unsplash.com/photo-1517420704952-d9f39e95b43e?auto=format&fit=crop&w=900&q=80', description: 'Four-channel oscilloscope for measuring and analysing electrical signals during electronics practical work.', manualUrl: 'https://beyondmeasure.rigoltech.com/acton/attachment/1579/f-0386/1/-/-/-/-/DS1000Z_UserGuide_EN.pdf', safetyManualUrl: 'https://www.rigolna.com/wp-content/uploads/2019/08/DS1000Z_UserGuide_EN.pdf', videoUrls: [{ title: 'Oscilloscope setup tutorial', url: 'https://www.youtube.com/watch?v=xaELqAo4kkQ' }], galleryImages: [], purchaseDate: '2025-02-12', warrantyExpiry: '2028-02-12', cost: 640, requiresMaintenance: false },
  { id: 'dmm-004', name: 'Digital Multimeter', assetTag: 'DMM-004', modelNumber: 'Fluke 117', serialNumber: 'RW-DMM-2026-004', category: 'Electronics', department: 'ICT', location: 'ICT Block, Ground Floor, ICT Lab, Cabinet C-02', status: 'Available', available: 8, stock: 10, image: 'https://images.unsplash.com/photo-1581092921461-39b9d08a9b21?auto=format&fit=crop&w=900&q=80', description: 'Portable meter for voltage, resistance, continuity, and current checks.', manualUrl: 'https://dam-assets.fluke.com/s3fs-public/117___umeng0200.pdf', safetyManualUrl: 'https://dam-assets.fluke.com/s3fs-public/117___umeng0200.pdf', videoUrls: [], galleryImages: [], purchaseDate: '2024-11-08', warrantyExpiry: '2027-11-08', cost: 210, requiresMaintenance: false },
  { id: 'psu-002', name: 'DC Power Supply', assetTag: 'PSU-002', modelNumber: 'Korad KA3005P', serialNumber: 'RW-PSU-2026-002', category: 'Power Systems', department: 'Renewable Energy', location: 'Energy Block, Floor 1, Energy Lab 1, Bench P-03', status: 'In Use', available: 2, stock: 6, image: 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?auto=format&fit=crop&w=900&q=80', description: 'Bench power supply for controlled DC output during circuit prototyping.', manualUrl: '#', safetyManualUrl: '#', videoUrls: [], galleryImages: [], purchaseDate: '2025-05-20', warrantyExpiry: '2028-05-20', cost: 380, requiresMaintenance: false },
  { id: 'lap-015', name: 'Laboratory Laptop', assetTag: 'LAP-015', modelNumber: 'Dell Latitude 5440', serialNumber: 'RW-LAP-2026-015', category: 'Computing', department: 'ICT', location: 'ICT Block, Floor 1, Software Lab, Charging Bay L-01', status: 'Available', available: 12, stock: 16, image: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=900&q=80', description: 'Department laptop with programming, simulation, and laboratory access tools.', manualUrl: '#', safetyManualUrl: '#', videoUrls: [], galleryImages: [], purchaseDate: '2025-09-01', warrantyExpiry: '2028-09-01', cost: 980, requiresMaintenance: false },
  { id: 'rtr-003', name: 'Cisco Training Router', assetTag: 'RTR-003', modelNumber: 'Cisco ISR 4321', serialNumber: 'RW-RTR-2026-003', category: 'Networking', department: 'ICT', location: 'ICT Block, Floor 1, Networking Lab, Rack N-03', status: 'Maintenance', available: 0, stock: 3, image: 'https://images.unsplash.com/photo-1606904825846-647eb07f5be2?auto=format&fit=crop&w=900&q=80', description: 'Training router for network configuration and routing-protocol laboratories.', manualUrl: '#', safetyManualUrl: '#', videoUrls: [], galleryImages: [], purchaseDate: '2023-07-14', warrantyExpiry: '2027-07-14', cost: 1250, requiresMaintenance: true },
  { id: 'plc-002', name: 'PLC Training Kit', assetTag: 'PLC-002', modelNumber: 'Siemens S7-1200', serialNumber: 'RW-PLC-2026-002', category: 'Automation', department: 'Mechatronic', location: 'Engineering Block, Ground Floor, Automation Lab, Station A-06', status: 'Available', available: 5, stock: 7, image: 'https://images.unsplash.com/photo-1581093458791-9f3c3900df7b?auto=format&fit=crop&w=900&q=80', description: 'Programmable logic-controller kit for sensors, actuators, and industrial control training.', manualUrl: '#', safetyManualUrl: '#', videoUrls: [{ title: 'PLC basics and safety', url: 'https://www.youtube.com/watch?v=Vq1rYEn06V0' }], galleryImages: [], purchaseDate: '2025-01-29', warrantyExpiry: '2028-01-29', cost: 1450, requiresMaintenance: false },
];

const reservations = [
  { id: 'REQ-1001', userId: 'usr-001', equipmentId: 'osc-001', purpose: 'Circuit measurement practice for analogue electronics.', startDate: '2026-06-29', endDate: '2026-07-01', status: 'Approved', moduleCode: 'ELC204', phoneNumber: '+250788100221', createdAt: now },
  { id: 'REQ-1002', userId: 'usr-001', equipmentId: 'dmm-004', purpose: 'Voltage and continuity checks for an embedded-systems assignment.', startDate: '2026-07-02', endDate: '2026-07-03', status: 'Pending', moduleCode: 'MEC212', phoneNumber: '+250788100221', createdAt: now },
  { id: 'REQ-1003', userId: 'usr-001', equipmentId: 'lap-015', purpose: 'Programming practical and documentation during project week.', startDate: '2026-07-04', endDate: '2026-07-05', status: 'Borrowed', moduleCode: 'ICT220', phoneNumber: '+250788100221', createdAt: now },
  { id: 'REQ-1004', userId: 'usr-001', equipmentId: 'plc-002', purpose: 'PLC workshop and ladder-logic training.', startDate: '2026-07-06', endDate: '2026-07-08', status: 'Returned', moduleCode: 'AUT302', phoneNumber: '+250788100221', createdAt: now },
  { id: 'REQ-1005', userId: 'usr-001', equipmentId: 'rtr-003', purpose: 'Routing-protocol practice after maintenance clearance.', startDate: '2026-07-08', endDate: '2026-07-09', status: 'Cancelled', moduleCode: 'NET310', phoneNumber: '+250788100221', createdAt: now },
  { id: 'REQ-1006', userId: 'usr-001', equipmentId: 'psu-002', purpose: 'Powering sensor prototypes in the renewable-energy laboratory.', startDate: '2026-07-10', endDate: '2026-07-11', status: 'Pending', moduleCode: 'REN301', phoneNumber: '+250788100221', createdAt: now },
];

const announcements = [
  { id: 'ann-001', title: 'Laboratory safety orientation', content: 'All first-time borrowers must attend the safety orientation before equipment issue.', department: 'All Departments', authorName: 'Lab Office', isNew: true, createdAt: now },
  { id: 'ann-002', title: 'Networking Lab maintenance', content: 'The networking laboratory is available after 14:00 while router maintenance is completed.', department: 'ICT', authorName: 'ICT Laboratory', isNew: true, createdAt: now },
  { id: 'ann-003', title: 'Return equipment on time', content: 'Borrowed equipment must be returned by the approved deadline and inspected by laboratory staff.', department: 'All Departments', authorName: 'Lab Office', isNew: false, createdAt: now },
  { id: 'ann-004', title: 'PLC practical booking', content: 'Automation Lab stations can be reserved through UniGuide before Friday practical sessions.', department: 'Mechatronic', authorName: 'Automation Lab', isNew: false, createdAt: now },
];

const departments = [
  { id: 'dep-001', name: 'Mechatronics', lead: 'Iradukunda David', users: 3, equipment: 12, activeLabs: 4, status: 'Active' },
  { id: 'dep-002', name: 'ICT', lead: 'Mukandanga Claire', users: 1, equipment: 29, activeLabs: 5, status: 'Active' },
  { id: 'dep-003', name: 'Renewable Energy', lead: 'Yvonne Keza', users: 0, equipment: 6, activeLabs: 3, status: 'Active' },
  { id: 'dep-004', name: 'Electronics and Telecommunication', lead: 'Eric Niyonsaba', users: 0, equipment: 0, activeLabs: 2, status: 'Active' },
];

const labLocations = [
  { id: 'lab-electronics-2', name: 'Electronics Lab 2', building: 'Engineering Block', floor: 'First Floor', department: 'Mechatronic', room: 'E-102', landmarks: ['Enter through the south reception', 'Use the first-floor east corridor', 'The laboratory is opposite the instrumentation store'], accessibleRoute: 'Use the ramp at the south entrance and the lift beside reception. Turn right on Floor 1; the lab is 24 metres along the east corridor.', accessibility: ['Step-free entrance', 'Lift access', '90 cm doorway', 'Accessible workbench'], openingHours: 'Monday–Friday, 08:00–17:00', contact: '0788 220 104' },
  { id: 'lab-ict', name: 'ICT Lab', building: 'ICT Block', floor: 'Ground Floor', department: 'ICT', room: 'ICT-G04', landmarks: ['Use the main ICT Block entrance', 'Pass the reception desk', 'The lab is the second door on the left'], accessibleRoute: 'The main ICT entrance is level with the courtyard. Follow the tactile strip past reception; ICT-G04 is 18 metres ahead on the left.', accessibility: ['Step-free entrance', 'Tactile route', 'Wide doorway', 'Accessible computer desk'], openingHours: 'Monday–Friday, 07:30–18:00', contact: '0788 220 118' },
  { id: 'lab-energy-1', name: 'Energy Lab 1', building: 'Energy Block', floor: 'First Floor', department: 'Renewable Energy', room: 'REN-105', landmarks: ['Enter from the library side', 'Take the lift to Floor 1', 'Follow signs for Renewable Energy'], accessibleRoute: 'Use the library-side ramp and lift. Exit on Floor 1 and follow the blue Renewable Energy signs for 30 metres.', accessibility: ['Ramp', 'Lift access', 'Low-height safety station', 'Accessible washroom nearby'], openingHours: 'Monday–Friday, 08:00–16:30', contact: '0788 220 132' },
  { id: 'lab-automation', name: 'Automation Lab', building: 'Engineering Block', floor: 'Ground Floor', department: 'Mechatronic', room: 'A-G06', landmarks: ['Enter through the north workshop gate', 'Continue past the fabrication room', 'Automation Lab is beside the control room'], accessibleRoute: 'Use the north workshop ramp. The marked step-free route continues straight for 36 metres to A-G06.', accessibility: ['Step-free route', 'High-contrast signs', 'Wide aisle', 'Adjustable-height PLC station'], openingHours: 'Monday–Friday, 08:00–17:00', contact: '0788 220 126' },
];

const publicUser = (user) => {
  if (!user) return null;
  const safe = { ...user };
  delete safe.password;
  return { ...safe, avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(user.fullName)}&background=1f5ff0&color=fff` };
};
const supportedRoles = ['Student', 'HOD', 'Lab Staff', 'Admin'];
const withRelations = (reservation) => ({ ...reservation, User: publicUser(users.find((u) => u.id === reservation.userId)), Equipment: equipment.find((e) => e.id === reservation.equipmentId) });
const makeToken = (user) => jwt.sign({ id: user.id, role: user.role, department: user.department }, process.env.JWT_SECRET || 'uniguide-development-secret', { expiresIn: '7d' });
const allowed = (user, roles) => Boolean(user && roles.includes(user.role));

function authenticate(req, res) {
  const value = req.header('Authorization') || '';
  if (!value.startsWith('Bearer ')) {
    res.status(401).json({ message: 'Please authenticate.' });
    return null;
  }
  try {
    const decoded = jwt.verify(value.slice(7), process.env.JWT_SECRET || 'uniguide-development-secret');
    const user = users.find((item) => item.id === decoded.id && item.status === 'Active');
    if (!user) throw new Error('Account unavailable');
    return user;
  } catch {
    res.status(401).json({ message: 'Invalid or expired session.' });
    return null;
  }
}

async function handleDemo(req, res) {
  const path = req.path.replace(/\/$/, '') || '/';
  const method = req.method.toUpperCase();

  if (path === '/health' && method === 'GET') return res.json({ status: 'ok', app: 'UniGuide API', mode: 'demonstration' });
  if (path === '/auth/login' && method === 'POST') {
    const user = users.find((item) => item.email.toLowerCase() === String(req.body.email || '').trim().toLowerCase() && item.password === req.body.password);
    if (!user) return res.status(401).json({ message: 'Invalid email or password.' });
    if (user.status === 'Pending') {
      return res.status(403).json({ message: 'Verify your email before signing in. Enter the code we sent you.', requiresVerification: true, email: user.email });
    }
    if (user.status !== 'Active') return res.status(401).json({ message: 'Invalid email or password.' });
    return res.json({ token: makeToken(user), user: publicUser(user) });
  }
  if (path === '/auth/register' && method === 'POST') {
    const address = String(req.body.email || '').trim().toLowerCase();
    const studentId = String(req.body.studentId || '').trim();
    if (!req.body.fullName || !address || String(req.body.password || '').length < 8) return res.status(400).json({ message: 'Name, valid email, and an 8-character password are required.' });
    if (!studentId) return res.status(400).json({ message: 'Your student ID is required to register.' });
    if (!isAllowedStudentEmail(address)) {
      return res.status(403).json({ message: `Registration is limited to an approved email domain (${mailConfig.studentEmailDomains.join(', ')}).` });
    }

    // The enrolment list is what proves the applicant studies here.
    const enrolment = roster.find((entry) => entry.studentId === studentId);
    if (!enrolment) return res.status(403).json({ message: 'That student ID is not on the college enrolment list. Contact the administrator.' });
    if (enrolment.status !== 'Enrolled') return res.status(403).json({ message: 'That student ID is no longer enrolled.' });
    if (enrolment.claimedByEmail && enrolment.claimedByEmail !== address) {
      return res.status(409).json({ message: 'That student ID has already been used to open an account.' });
    }

    const existing = users.find((item) => item.email === address);
    if (existing && existing.status !== 'Pending') return res.status(409).json({ message: 'An account already exists for this email.' });

    const user = existing || {
      id: `usr-${String(nextUser++).padStart(3, '0')}`,
      fullName: req.body.fullName,
      email: address,
      password: req.body.password,
      role: 'Student',
      // From the roster, never the signup form.
      department: enrolment.department,
      studentId,
      canBorrow: true,
      canReserve: true,
      canViewReports: false,
    };
    // Pending until the emailed code is entered, exactly as in the database path.
    user.status = 'Pending';
    if (!existing) users.push(user);

    const code = issueDemoOtp(address, 'register');
    const delivery = await emailService.send(address, emailService.templates.registrationOtp({ fullName: user.fullName, code }));
    return res.status(201).json({
      success: true,
      message: `We sent a 6-digit code to ${address}. Enter it to activate your account.`,
      email: address,
      emailSent: delivery.sent,
      ...(emailService.isLive() ? {} : { devCode: code }),
    });
  }
  if (path === '/auth/verify-otp' && method === 'POST') {
    const address = String(req.body.email || '').trim().toLowerCase();
    const user = users.find((item) => item.email === address);
    if (!user) return res.status(404).json({ message: 'No account is waiting for verification.' });
    if (user.status === 'Active') return res.status(409).json({ message: 'This account is already verified. Please sign in.' });

    const result = verifyDemoOtp(address, 'register', req.body.code);
    if (!result.ok) return res.status(400).json({ message: result.message });

    user.status = 'Active';
    const enrolment = roster.find((entry) => entry.studentId === user.studentId);
    if (enrolment) {
      enrolment.claimedByEmail = address;
      enrolment.claimedAt = new Date().toISOString();
    }
    emailService.sendInBackground(address, emailService.templates.welcome({ fullName: user.fullName, department: user.department, studentId: user.studentId }));
    return res.json({ token: makeToken(user), user: publicUser(user) });
  }
  if (path === '/auth/resend-otp' && method === 'POST') {
    const address = String(req.body.email || '').trim().toLowerCase();
    const user = users.find((item) => item.email === address && item.status === 'Pending');
    if (!user) return res.json({ success: true, message: 'If that account is awaiting verification, a new code has been sent.' });
    const code = issueDemoOtp(address, 'register');
    const delivery = await emailService.send(address, emailService.templates.registrationOtp({ fullName: user.fullName, code }));
    return res.json({ success: true, message: `A new code was sent to ${address}.`, emailSent: delivery.sent, ...(emailService.isLive() ? {} : { devCode: code }) });
  }
  if (path === '/auth/forgot-password' && method === 'POST') {
    const address = String(req.body.email || '').trim().toLowerCase();
    const user = users.find((item) => item.email === address);
    const generic = { success: true, message: 'If an account exists for that email, a reset code has been sent.' };
    if (!user) return res.json(generic);
    const code = issueDemoOtp(address, 'reset');
    await emailService.send(address, emailService.templates.passwordResetOtp({ fullName: user.fullName, code }));
    return res.json({ ...generic, ...(emailService.isLive() ? {} : { devCode: code }) });
  }
  if (path === '/auth/reset-password' && method === 'POST') {
    const address = String(req.body.email || '').trim().toLowerCase();
    if (String(req.body.password || '').length < 8) return res.status(400).json({ message: 'The new password must be at least 8 characters.' });
    const user = users.find((item) => item.email === address);
    if (!user) return res.status(400).json({ message: 'That code is not valid.' });
    const result = verifyDemoOtp(address, 'reset', req.body.code);
    if (!result.ok) return res.status(400).json({ message: result.message });
    user.password = req.body.password;
    if (user.status === 'Pending') user.status = 'Active';
    return res.json({ success: true, message: 'Your password has been changed. Please sign in.' });
  }

  if (path === '/equipment' && method === 'GET') return res.json({ equipment, total: equipment.length, page: 1, totalPages: 1 });
  const equipmentMatch = path.match(/^\/equipment\/([^/]+)$/);
  if (equipmentMatch && method === 'GET') {
    const item = equipment.find((row) => row.id === equipmentMatch[1] || row.assetTag === equipmentMatch[1]);
    return item ? res.json(item) : res.status(404).json({ message: 'Equipment not found.' });
  }
  const qrMatch = path.match(/^\/equipment\/([^/]+)\/qr$/);
  if (qrMatch && method === 'GET') {
    const item = equipment.find((row) => row.id === qrMatch[1]);
    if (!item) return res.status(404).json({ message: 'Equipment not found.' });
    const origin = process.env.FRONTEND_URL || `${req.protocol}://${req.get('host')}`;
    const targetUrl = `${origin}/equipment/${item.id}`;
    const dataUrl = await QRCode.toDataURL(targetUrl, { width: 420, margin: 2, errorCorrectionLevel: 'H', color: { dark: '#08162d', light: '#ffffff' } });
    return res.json({ equipmentId: item.id, assetTag: item.assetTag, targetUrl, dataUrl });
  }

  if (path === '/lab-locations' && method === 'GET') return res.json(labLocations);
  if (path === '/lab-locations' && method === 'POST') {
    const user = authenticate(req, res);
    if (!user) return undefined;
    if (!allowed(user, ['Admin', 'HOD', 'Lab Staff'])) return res.status(403).json({ message: 'Laboratory guide permission required.' });
    const department = String(req.body.department || '').trim();
    if (!String(req.body.name || '').trim()) return res.status(400).json({ message: 'A laboratory name is required.' });
    if (!demoDepartments.includes(department)) return res.status(400).json({ message: `Department must be one of: ${demoDepartments.join(', ')}.` });
    if (user.role !== 'Admin' && user.department !== department) {
      return res.status(403).json({ message: 'You can only add laboratories in your own department.' });
    }
    const lab = {
      id: `lab-${String(nextLab++).padStart(3, '0')}`,
      name: String(req.body.name).trim(),
      department,
      building: req.body.building || null,
      floor: req.body.floor || null,
      room: req.body.room || null,
      landmarks: toDemoList(req.body.landmarks),
      accessibleRoute: req.body.accessibleRoute || null,
      accessibility: toDemoList(req.body.accessibility),
      openingHours: req.body.openingHours || null,
      contact: req.body.contact || null,
    };
    labLocations.push(lab);
    return res.status(201).json(lab);
  }
  const labMatch = path.match(/^\/lab-locations\/([^/]+)$/);
  if (labMatch && ['PUT', 'PATCH'].includes(method)) {
    const user = authenticate(req, res);
    if (!user) return undefined;
    if (!allowed(user, ['Admin', 'HOD', 'Lab Staff'])) return res.status(403).json({ message: 'Laboratory guide permission required.' });
    const lab = labLocations.find((row) => row.id === labMatch[1]);
    if (!lab) return res.status(404).json({ message: 'Laboratory not found.' });
    if (user.role !== 'Admin' && user.department !== lab.department) {
      return res.status(403).json({ message: 'You can only edit laboratories in your own department.' });
    }
    for (const field of ['name', 'building', 'floor', 'room', 'accessibleRoute', 'openingHours', 'contact']) {
      if (req.body[field] !== undefined) lab[field] = req.body[field] || null;
    }
    if (req.body.landmarks !== undefined) lab.landmarks = toDemoList(req.body.landmarks);
    if (req.body.accessibility !== undefined) lab.accessibility = toDemoList(req.body.accessibility);
    return res.json(lab);
  }
  if (labMatch && method === 'DELETE') {
    const user = authenticate(req, res);
    if (!user) return undefined;
    if (!allowed(user, ['Admin', 'HOD', 'Lab Staff'])) return res.status(403).json({ message: 'Laboratory guide permission required.' });
    const index = labLocations.findIndex((row) => row.id === labMatch[1]);
    if (index < 0) return res.status(404).json({ message: 'Laboratory not found.' });
    if (user.role !== 'Admin' && user.department !== labLocations[index].department) {
      return res.status(403).json({ message: 'You can only remove laboratories in your own department.' });
    }
    labLocations.splice(index, 1);
    return res.json({ message: 'Laboratory guide removed.' });
  }
  if (path === '/announcements' && method === 'GET') return res.json(announcements);

  const user = authenticate(req, res);
  if (!user) return undefined;
  if (path === '/auth/me' && method === 'GET') return res.json(publicUser(user));
  if (path === '/auth/me' && method === 'PATCH') {
    const email = String(req.body.email || user.email).trim().toLowerCase();
    if (users.some((item) => item.id !== user.id && item.email === email)) return res.status(409).json({ message: 'Email is already in use.' });
    user.fullName = String(req.body.fullName || user.fullName).trim();
    user.email = email;
    return res.json(publicUser(user));
  }

  if (path === '/departments' && method === 'GET') {
    if (!allowed(user, ['Admin', 'HOD'])) return res.status(403).json({ message: 'Department access permission required.' });
    return res.json(departments);
  }
  if (path === '/departments' && method === 'POST') {
    if (user.role !== 'Admin') return res.status(403).json({ message: 'Administrator role required.' });
    if (departments.some((item) => item.name.toLowerCase() === String(req.body.name || '').toLowerCase())) return res.status(409).json({ message: 'Department already exists.' });
    const row = { id: `dep-${String(departments.length + 1).padStart(3, '0')}`, name: req.body.name, lead: req.body.lead, users: 0, equipment: 0, activeLabs: Number(req.body.activeLabs || 0), status: 'Active' };
    departments.push(row);
    return res.status(201).json(row);
  }
  const departmentMatch = path.match(/^\/departments\/([^/]+)$/);
  if (departmentMatch && ['PUT', 'PATCH'].includes(method)) {
    if (user.role !== 'Admin') return res.status(403).json({ message: 'Administrator role required.' });
    const row = departments.find((item) => item.id === departmentMatch[1]);
    if (!row) return res.status(404).json({ message: 'Department not found.' });
    if (req.body.name && departments.some((item) => item.id !== row.id && item.name.toLowerCase() === String(req.body.name).toLowerCase())) {
      return res.status(409).json({ message: 'Department already exists.' });
    }
    if (req.body.name !== undefined) row.name = req.body.name;
    if (req.body.lead !== undefined) row.lead = req.body.lead;
    if (req.body.activeLabs !== undefined) row.activeLabs = Number(req.body.activeLabs || 0);
    if (req.body.status !== undefined) row.status = req.body.status;
    return res.json(row);
  }
  if (departmentMatch && method === 'DELETE') {
    if (user.role !== 'Admin') return res.status(403).json({ message: 'Administrator role required.' });
    const row = departments.find((item) => item.id === departmentMatch[1]);
    if (!row) return res.status(404).json({ message: 'Department not found.' });
    row.status = 'Inactive';
    return res.json({ message: 'Department deactivated.', department: row });
  }

  if (path === '/equipment' && method === 'POST') {
    if (!allowed(user, ['Admin', 'HOD', 'Lab Staff'])) return res.status(403).json({ message: 'Role not permitted to register equipment.' });
    const id = `eq-${String(nextEquipment++).padStart(3, '0')}`;
    const equipmentData = { ...req.body };
    if (user.role !== 'Admin' && user.department) equipmentData.department = user.department;
    const item = { id, ...equipmentData, stock: Number(equipmentData.stock || 1), available: Number(equipmentData.available ?? equipmentData.stock ?? 1), status: equipmentData.status || 'Available', createdAt: new Date().toISOString() };
    equipment.unshift(item);
    return res.status(201).json(item);
  }
  if (equipmentMatch && ['PUT', 'PATCH'].includes(method)) {
    if (!allowed(user, ['Admin', 'HOD', 'Lab Staff'])) return res.status(403).json({ message: 'Role not permitted to update equipment.' });
    const item = equipment.find((row) => row.id === equipmentMatch[1]);
    if (!item) return res.status(404).json({ message: 'Equipment not found.' });
    if (user.role !== 'Admin' && item.department && user.department && item.department !== user.department) {
      return res.status(403).json({ message: 'Unauthorized: You can only manage equipment in your department.' });
    }
    const equipmentData = { ...req.body };
    if (user.role !== 'Admin' && user.department) equipmentData.department = item.department || user.department;
    Object.assign(item, equipmentData);
    return res.json(item);
  }
  if (equipmentMatch && method === 'DELETE') {
    if (user.role !== 'Admin') return res.status(403).json({ message: 'Administrator role required.' });
    const index = equipment.findIndex((row) => row.id === equipmentMatch[1]);
    if (index < 0) return res.status(404).json({ message: 'Equipment not found.' });
    equipment.splice(index, 1);
    return res.json({ message: 'Equipment deleted.' });
  }

  if (path === '/reservations' && method === 'POST') {
    if (!user.canBorrow || user.role !== 'Student') return res.status(403).json({ message: 'Only student accounts can request equipment.' });
    const item = equipment.find((row) => row.id === req.body.equipmentId);
    if (!item || item.available < 1 || item.status === 'Maintenance') return res.status(409).json({ message: 'Equipment is unavailable for the requested period.' });
    const row = { id: `REQ-${1000 + nextReservation++}`, userId: user.id, equipmentId: item.id, purpose: req.body.purpose, startDate: req.body.startDate, endDate: req.body.endDate, status: 'Pending', moduleCode: req.body.moduleCode || '', phoneNumber: req.body.phoneNumber || '', createdAt: new Date().toISOString() };
    reservations.unshift(row);
    return res.status(201).json(withRelations(row));
  }
  if (path === '/reservations/my' && method === 'GET') return res.json(reservations.filter((row) => row.userId === user.id).map(withRelations));
  if (path === '/reservations/all' && method === 'GET') {
    if (!allowed(user, ['Admin', 'HOD', 'Lab Staff'])) return res.status(403).json({ message: 'Role not permitted to review reservations.' });
    let rows = reservations.map(withRelations);
    if (user.role !== 'Admin' && user.department) {
      rows = rows.filter((row) => row.Equipment?.department === user.department);
    }
    return res.json(rows);
  }
  const reservationMatch = path.match(/^\/reservations\/([^/]+)$/);
  if (reservationMatch && ['PUT', 'PATCH'].includes(method)) {
    const row = reservations.find((item) => item.id === reservationMatch[1]);
    if (!row) return res.status(404).json({ message: 'Reservation not found.' });
    const nextStatus = req.body.status || row.status;
    const reservationTransitions = {
      Pending: ['Approved', 'Cancelled'],
      Approved: ['Borrowed', 'Cancelled'],
      Borrowed: ['Returned', 'Overdue'],
      Overdue: ['Returned'],
      Returned: [],
      Cancelled: [],
    };
    if (req.body.status && row.status !== nextStatus && !reservationTransitions[row.status]?.includes(nextStatus)) {
      return res.status(409).json({ message: `Cannot change a ${row.status} request to ${nextStatus}.` });
    }
    const isOwnPendingCancellation = row.userId === user.id && row.status === 'Pending' && req.body.status === 'Cancelled';
    const isStaff = allowed(user, ['Admin', 'HOD', 'Lab Staff']);
    if (!isOwnPendingCancellation && !isStaff) return res.status(403).json({ message: 'Role not permitted to process reservations.' });
    const item = equipment.find((record) => record.id === row.equipmentId);
    const itemDept = item?.department;
    if (!isOwnPendingCancellation && user.role !== 'Admin' && itemDept !== user.department) {
      return res.status(403).json({ message: 'Unauthorized: You can only manage requests for your department.' });
    }
    if (isStaff && !isOwnPendingCancellation && ['Approved', 'Cancelled'].includes(req.body.status) && !String(req.body.reason || '').trim()) {
      return res.status(400).json({ message: 'A reason is required to approve or reject a request.' });
    }
    const previous = row.status;
    row.status = nextStatus;
    if (req.body.reason !== undefined) row.decisionReason = req.body.reason;
    if (item && previous !== 'Borrowed' && row.status === 'Borrowed') item.available = Math.max(0, item.available - 1);
    if (item && previous === 'Borrowed' && row.status === 'Returned') item.available = Math.min(item.stock, item.available + 1);
    return res.json(withRelations(row));
  }

  if (path === '/roster' && method === 'GET') {
    if (!allowed(user, ['Admin', 'HOD'])) return res.status(403).json({ message: 'Enrolment list permission required.' });
    const search = String(req.query.search || '').trim().toLowerCase();
    const entries = search
      ? roster.filter((entry) => entry.studentId.toLowerCase().includes(search) || String(entry.fullName || '').toLowerCase().includes(search))
      : roster;
    return res.json({
      entries,
      total: roster.length,
      claimed: roster.filter((entry) => entry.claimedAt).length,
      departments: demoDepartments,
    });
  }
  if (path === '/roster' && method === 'POST') {
    if (!allowed(user, ['Admin'])) return res.status(403).json({ message: 'Enrolment list permission required.' });
    const studentId = String(req.body.studentId || '').trim();
    const department = String(req.body.department || '').trim();
    if (!studentId) return res.status(400).json({ message: 'A student ID is required.' });
    if (!demoDepartments.includes(department)) return res.status(400).json({ message: `Department must be one of: ${demoDepartments.join(', ')}.` });
    if (roster.some((entry) => entry.studentId === studentId)) return res.status(409).json({ message: 'That student ID is already on the list.' });
    const entry = { id: `rst-${String(nextRoster++).padStart(3, '0')}`, studentId, fullName: String(req.body.fullName || '').trim() || null, department, status: 'Enrolled', claimedByEmail: null, claimedAt: null };
    roster.push(entry);
    return res.status(201).json(entry);
  }
  if (path === '/roster/import' && method === 'POST') {
    if (!allowed(user, ['Admin'])) return res.status(403).json({ message: 'Enrolment list permission required.' });
    let rows = req.body.entries;
    if (!Array.isArray(rows) && typeof req.body.csv === 'string') {
      const lines = req.body.csv.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
      if (lines.length && /student\s*id/i.test(lines[0])) lines.shift();
      rows = lines.map((line) => {
        const [studentId, fullName, department] = line.split(',').map((cell) => (cell || '').trim());
        return { studentId, fullName, department };
      });
    }
    if (!Array.isArray(rows) || !rows.length) return res.status(400).json({ message: 'Provide the students as CSV text or a JSON array.' });

    let added = 0;
    let updated = 0;
    const skipped = [];
    for (const row of rows) {
      const studentId = String(row.studentId || '').trim();
      const department = String(row.department || '').trim();
      if (!studentId) { skipped.push({ row, reason: 'Missing student ID.' }); continue; }
      if (!demoDepartments.includes(department)) { skipped.push({ studentId, reason: `Unknown department "${row.department || ''}".` }); continue; }
      const existing = roster.find((entry) => entry.studentId === studentId);
      if (existing) {
        if (existing.claimedAt) { skipped.push({ studentId, reason: 'Already claimed by a registered student.' }); continue; }
        existing.fullName = String(row.fullName || '').trim() || null;
        existing.department = department;
        updated += 1;
        continue;
      }
      roster.push({ id: `rst-${String(nextRoster++).padStart(3, '0')}`, studentId, fullName: String(row.fullName || '').trim() || null, department, status: 'Enrolled', claimedByEmail: null, claimedAt: null });
      added += 1;
    }
    return res.status(201).json({ message: `${added} added, ${updated} updated, ${skipped.length} skipped.`, added, updated, skipped, total: roster.length });
  }
  const rosterMatch = path.match(/^\/roster\/([^/]+)$/);
  if (rosterMatch && method === 'PATCH') {
    if (!allowed(user, ['Admin'])) return res.status(403).json({ message: 'Enrolment list permission required.' });
    const entry = roster.find((item) => item.id === rosterMatch[1]);
    if (!entry) return res.status(404).json({ message: 'Student not found on the list.' });
    if (req.body.fullName !== undefined) entry.fullName = String(req.body.fullName).trim() || null;
    if (req.body.department !== undefined) {
      if (!demoDepartments.includes(req.body.department)) return res.status(400).json({ message: 'Unknown department.' });
      entry.department = req.body.department;
    }
    if (req.body.status !== undefined) {
      if (!['Enrolled', 'Withdrawn'].includes(req.body.status)) return res.status(400).json({ message: 'Status must be Enrolled or Withdrawn.' });
      entry.status = req.body.status;
    }
    return res.json(entry);
  }
  const rosterReleaseMatch = path.match(/^\/roster\/([^/]+)\/release$/);
  if (rosterReleaseMatch && method === 'POST') {
    if (!allowed(user, ['Admin'])) return res.status(403).json({ message: 'Enrolment list permission required.' });
    const entry = roster.find((item) => item.id === rosterReleaseMatch[1]);
    if (!entry) return res.status(404).json({ message: 'Student not found on the list.' });
    if (!entry.claimedAt) return res.status(400).json({ message: 'That record has not been claimed.' });
    const index = users.findIndex((item) => item.studentId === entry.studentId);
    if (index >= 0) users.splice(index, 1);
    entry.claimedByEmail = null;
    entry.claimedAt = null;
    return res.json({ message: 'The student ID can be registered again.', entry });
  }
  if (rosterMatch && method === 'DELETE') {
    if (!allowed(user, ['Admin'])) return res.status(403).json({ message: 'Enrolment list permission required.' });
    const index = roster.findIndex((item) => item.id === rosterMatch[1]);
    if (index < 0) return res.status(404).json({ message: 'Student not found on the list.' });
    if (roster[index].claimedAt) return res.status(409).json({ message: 'That student has an active account. Mark them Withdrawn instead, or release the ID first.' });
    roster.splice(index, 1);
    return res.json({ message: 'Removed from the enrolment list.' });
  }

  if (path === '/users' && method === 'GET') {
    if (!allowed(user, ['Admin'])) return res.status(403).json({ message: 'Account administration permission required.' });
    return res.json(users.map(publicUser));
  }
  if (path === '/users' && method === 'POST') {
    if (!allowed(user, ['Admin'])) return res.status(403).json({ message: 'Account administration permission required.' });
    const email = String(req.body.email || '').toLowerCase();
    if (users.some((item) => item.email === email)) return res.status(409).json({ message: 'Email already registered.' });
    const nextRole = supportedRoles.includes(req.body.role) ? req.body.role : 'Student';
    const row = { id: `usr-${String(nextUser++).padStart(3, '0')}`, fullName: req.body.fullName, email, password: req.body.password || 'ChangeMe123', role: nextRole, department: req.body.department || 'ICT', studentId: req.body.studentId || '', status: req.body.status || 'Active', canBorrow: req.body.canBorrow !== false, canReserve: req.body.canReserve !== false, canViewReports: Boolean(req.body.canViewReports) };
    users.push(row);
    return res.status(201).json(publicUser(row));
  }
  const userMatch = path.match(/^\/users\/([^/]+)$/);
  if (userMatch && ['PUT', 'PATCH'].includes(method)) {
    if (!allowed(user, ['Admin'])) return res.status(403).json({ message: 'Account administration permission required.' });
    const row = users.find((item) => item.id === userMatch[1]);
    if (!row) return res.status(404).json({ message: 'User not found.' });
    if (req.body.role && !supportedRoles.includes(req.body.role)) return res.status(400).json({ message: 'Only the four supported presentation roles are allowed.' });
    Object.assign(row, req.body);
    return res.json(publicUser(row));
  }
  if (userMatch && method === 'DELETE') {
    if (!allowed(user, ['Admin'])) return res.status(403).json({ message: 'Account administration permission required.' });
    if (user.id === userMatch[1]) return res.status(400).json({ message: 'You cannot delete your active administrator account.' });
    const index = users.findIndex((item) => item.id === userMatch[1]);
    if (index < 0) return res.status(404).json({ message: 'User not found.' });
    users.splice(index, 1);
    return res.json({ message: 'User deleted.' });
  }

  if (path === '/announcements' && method === 'POST') {
    if (!allowed(user, ['Admin', 'HOD', 'Lab Staff'])) return res.status(403).json({ message: 'Role not permitted to publish announcements.' });
    const row = { id: `ann-${String(nextAnnouncement++).padStart(3, '0')}`, ...req.body, authorName: req.body.authorName || user.fullName, createdAt: new Date().toISOString() };
    announcements.unshift(row);
    return res.status(201).json(row);
  }
  const announcementMatch = path.match(/^\/announcements\/([^/]+)$/);
  if (announcementMatch && method === 'DELETE') {
    if (!allowed(user, ['Admin', 'HOD'])) return res.status(403).json({ message: 'Role not permitted to remove announcements.' });
    const index = announcements.findIndex((item) => item.id === announcementMatch[1]);
    if (index < 0) return res.status(404).json({ message: 'Announcement not found.' });
    announcements.splice(index, 1);
    return res.json({ message: 'Announcement removed.' });
  }

  if (path === '/dashboard/stats' && method === 'GET') return res.json({ totalEquipment: equipment.length, availableEquipment: equipment.reduce((sum, item) => sum + item.available, 0), totalUsers: users.length, pendingReservations: reservations.filter((row) => row.status === 'Pending').length, activeLoans: reservations.filter((row) => row.status === 'Borrowed').length });
  if (path === '/dashboard/reports' && method === 'GET') {
    if (!allowed(user, ['Admin', 'HOD'])) return res.status(403).json({ message: 'Reporting permission required.' });
    const weeklyActivity = Array.from({ length: 7 }, (_, index) => {
      const date = new Date('2026-06-23T00:00:00.000Z');
      date.setUTCDate(date.getUTCDate() + index);
      const iso = date.toISOString().slice(0, 10);
      return { name: date.toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' }), value: reservations.filter((row) => row.createdAt?.slice(0, 10) === iso).length, prev: 0 };
    });
    const deptDistribution = Object.values(equipment.reduce((map, item) => {
      map[item.department] = map[item.department] || { name: item.department, value: 0 };
      map[item.department].value += item.stock;
      return map;
    }, {}));
    const roleDistribution = Object.values(users.reduce((map, item) => {
      map[item.role] = map[item.role] || { name: item.role, value: 0 };
      map[item.role].value += 1;
      return map;
    }, {}));
    const topEquipment = Object.entries(reservations.reduce((map, row) => {
      map[row.equipmentId] = (map[row.equipmentId] || 0) + 1;
      return map;
    }, {})).map(([id, count]) => {
      const item = equipment.find((record) => record.id === id);
      return { name: item?.name || id, category: item?.category || 'General', count };
    }).sort((a, b) => b.count - a.count).slice(0, 5);
    return res.json({
      weeklyActivity, deptDistribution, roleDistribution, topEquipment,
      statusDistribution: ['Pending', 'Approved', 'Borrowed', 'Returned', 'Cancelled'].map((status) => ({ name: status, value: reservations.filter((row) => row.status === status).length })),
      stats: { totalUsers: users.length, totalEquipment: equipment.length, totalReservations: reservations.length, pendingRequests: reservations.filter((row) => row.status === 'Pending').length, activeLoans: reservations.filter((row) => row.status === 'Borrowed').length },
    });
  }

  return res.status(404).json({ message: 'Demo API route not found.' });
}

module.exports = { handleDemo, users, equipment, reservations, announcements, departments, labLocations };
