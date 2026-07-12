const jwt = require('jsonwebtoken');
const QRCode = require('qrcode');

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
    if (!user || user.status !== 'Active') return res.status(401).json({ message: 'Invalid email or password.' });
    return res.json({ token: makeToken(user), user: publicUser(user) });
  }
  if (path === '/auth/register' && method === 'POST') {
    const email = String(req.body.email || '').trim().toLowerCase();
    if (!req.body.fullName || !email || String(req.body.password || '').length < 8) return res.status(400).json({ message: 'Name, valid email, and an 8-character password are required.' });
    if (users.some((item) => item.email === email)) return res.status(409).json({ message: 'Email already registered.' });
    const role = 'Student';
    const user = { id: `usr-${String(nextUser++).padStart(3, '0')}`, fullName: req.body.fullName, email, password: req.body.password, role, department: req.body.department || 'ICT', studentId: req.body.studentId || '', status: 'Active', canBorrow: true, canReserve: true, canViewReports: false };
    users.push(user);
    return res.status(201).json({ token: makeToken(user), user: publicUser(user) });
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
