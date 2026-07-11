const fs = require('fs');
const path = require('path');

const baseUrl = process.env.UNIGUIDE_URL || 'http://localhost:5001';
const results = [];

function record(name, passed, detail = '') {
  results.push({ name, passed, detail });
  console.log(`${passed ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`);
  if (!passed) throw new Error(`${name}: ${detail}`);
}

async function request(endpoint, options = {}) {
  const response = await fetch(`${baseUrl}${endpoint}`, options);
  const text = await response.text();
  let data;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  return { status: response.status, data, headers: response.headers };
}

function auth(token, extra = {}) {
  return { ...extra, Authorization: `Bearer ${token}` };
}

async function login(email) {
  const response = await request('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: 'password123' }),
  });
  record(`Login: ${email}`, response.status === 200 && Boolean(response.data.token), `HTTP ${response.status}`);
  return response.data;
}

async function run() {
  const startedAt = new Date().toISOString();
  const health = await request('/api/health');
  record('API health check', health.status === 200 && health.data.app === 'UniGuide API', `${health.data.mode} mode`);

  const accounts = {};
  for (const [role, email] of Object.entries({
    student: 'student@uniguide.rw', lecturer: 'lecturer@uniguide.rw', labStaff: 'labstaff@uniguide.rw',
    hod: 'hod@uniguide.rw', stockManager: 'stock@uniguide.rw', admin: 'admin@uniguide.rw', support: 'support@uniguide.rw',
  })) accounts[role] = await login(email);
  const unique = Date.now();

  const publicRegistration = await request('/api/auth/register', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fullName: 'Public Verification Student', email: `public-${unique}@uniguide.rw`, password: 'Temporary123', role: 'Admin', department: 'ICT', studentId: `PUBLIC-${unique}` }),
  });
  record('Public registration cannot grant an elevated role', publicRegistration.status === 201 && publicRegistration.data.user.role === 'Student', publicRegistration.data.user.role);
  const profileUpdate = await request('/api/auth/me', {
    method: 'PATCH', headers: auth(publicRegistration.data.token, { 'Content-Type': 'application/json' }),
    body: JSON.stringify({ fullName: 'Updated Verification Student', email: `public-${unique}@uniguide.rw` }),
  });
  record('Authenticated user updates own profile', profileUpdate.status === 200 && profileUpdate.data.fullName === 'Updated Verification Student', `HTTP ${profileUpdate.status}`);

  const denied = await request('/api/users');
  record('Anonymous access is rejected', denied.status === 401, `HTTP ${denied.status}`);
  const anonymousAnnouncement = await request('/api/announcements', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: 'Unauthorized', content: 'Must not be created.' }),
  });
  record('Anonymous announcement publishing is rejected', anonymousAnnouncement.status === 401, `HTTP ${anonymousAnnouncement.status}`);

  const equipment = await request('/api/equipment');
  const equipmentRows = equipment.data.equipment || equipment.data;
  record('Equipment catalogue is available', equipment.status === 200 && equipmentRows.length >= 6, `${equipmentRows.length} assets`);

  const qr = await request(`/api/equipment/${equipmentRows[0].id}/qr`);
  record('Equipment QR PNG is generated', qr.status === 200 && qr.data.dataUrl.startsWith('data:image/png;base64,'), qr.data.assetTag);

  const locations = await request('/api/lab-locations');
  record('Accessible laboratory guidance is available', locations.status === 200 && locations.data.every((lab) => lab.accessibleRoute && lab.landmarks.length), `${locations.data.length} laboratories`);

  const studentHeaders = auth(accounts.student.token, { 'Content-Type': 'application/json' });
  const studentRequests = await request('/api/reservations/my', { headers: studentHeaders });
  record('Student sees only own reservations', studentRequests.status === 200 && studentRequests.data.every((row) => row.User.email === 'student@uniguide.rw'), `${studentRequests.data.length} records`);
  const reservableEquipment = equipmentRows.find((item) => item.assetTag === 'OSC-001') || equipmentRows.find((item) => item.available > 0);
  const createReservation = await request('/api/reservations', {
    method: 'POST', headers: studentHeaders,
    body: JSON.stringify({ equipmentId: reservableEquipment.id, purpose: 'Automated verification of the borrowing workflow.', startDate: '2026-07-14', endDate: '2026-07-15', moduleCode: 'QA401', phoneNumber: '+250788000000' }),
  });
  record('Student creates a pending reservation', createReservation.status === 201 && createReservation.data.status === 'Pending', createReservation.data.id);
  const cancelReservation = await request(`/api/reservations/${createReservation.data.id}`, { method: 'PATCH', headers: studentHeaders, body: JSON.stringify({ status: 'Cancelled' }) });
  record('Student cancels own pending reservation', cancelReservation.status === 200 && cancelReservation.data.status === 'Cancelled', cancelReservation.data.id);
  const studentAdminDenied = await request('/api/users', { headers: studentHeaders });
  record('Student cannot administer accounts', studentAdminDenied.status === 403, `HTTP ${studentAdminDenied.status}`);
  const studentReportsDenied = await request('/api/dashboard/reports', { headers: studentHeaders });
  record('Student cannot open management reports', studentReportsDenied.status === 403, `HTTP ${studentReportsDenied.status}`);

  const staffHeaders = auth(accounts.labStaff.token, { 'Content-Type': 'application/json' });
  const allReservations = await request('/api/reservations/all', { headers: staffHeaders });
  record('Lab staff reviews department reservation queue', allReservations.status === 200 && allReservations.data.length >= 1 && allReservations.data.every((row) => row.Equipment?.department === accounts.labStaff.user.department), `${allReservations.data.length} department records`);
  const pendingWorkflow = allReservations.data.find((row) => row.status === 'Pending' && row.Equipment);
  let workflow = await request(`/api/reservations/${pendingWorkflow.id}`, { method: 'PATCH', headers: staffHeaders, body: JSON.stringify({ status: 'Approved', reason: 'Verification approval note.' }) });
  workflow = await request(`/api/reservations/${pendingWorkflow.id}`, { method: 'PATCH', headers: staffHeaders, body: JSON.stringify({ status: 'Borrowed' }) });
  const borrowedStock = (await request(`/api/equipment/${pendingWorkflow.Equipment.id}`)).data.available;
  workflow = await request(`/api/reservations/${pendingWorkflow.id}`, { method: 'PATCH', headers: staffHeaders, body: JSON.stringify({ status: 'Returned' }) });
  const returnedStock = (await request(`/api/equipment/${pendingWorkflow.Equipment.id}`)).data.available;
  record('Approval, issue, and return workflow updates stock', workflow.status === 200 && workflow.data.status === 'Returned' && returnedStock === borrowedStock + 1, `${borrowedStock} → ${returnedStock} available`);

  const hodReports = await request('/api/dashboard/reports', { headers: auth(accounts.hod.token) });
  record('HOD opens management reports', hodReports.status === 200 && hodReports.data.stats.totalEquipment >= 6, `${hodReports.data.stats.totalReservations} reservations`);
  const stockReports = await request('/api/dashboard/reports', { headers: auth(accounts.stockManager.token) });
  record('Stock manager opens inventory reports', stockReports.status === 200, `HTTP ${stockReports.status}`);

  const adminHeaders = auth(accounts.admin.token, { 'Content-Type': 'application/json' });
  const users = await request('/api/users', { headers: adminHeaders });
  record('Administrator lists user accounts', users.status === 200 && users.data.length >= 7, `${users.data.length} accounts`);
  const createdUser = await request('/api/users', {
    method: 'POST', headers: adminHeaders,
    body: JSON.stringify({ fullName: 'Verification User', email: `verify-${unique}@uniguide.rw`, password: 'Temporary123', role: 'Student', department: 'ICT', studentId: `VERIFY-${unique}`, status: 'Active' }),
  });
  record('Administrator creates a user', createdUser.status === 201 && createdUser.data.fullName === 'Verification User', createdUser.data.id);
  const updatedUser = await request(`/api/users/${createdUser.data.id}`, { method: 'PATCH', headers: adminHeaders, body: JSON.stringify({ status: 'Inactive' }) });
  record('Administrator updates account status', updatedUser.status === 200 && updatedUser.data.status === 'Inactive', updatedUser.data.id);
  const deletedUser = await request(`/api/users/${createdUser.data.id}`, { method: 'DELETE', headers: adminHeaders });
  record('Administrator deactivates or removes a user', deletedUser.status === 200, `HTTP ${deletedUser.status}`);
  const removedPublicUser = await request(`/api/users/${publicRegistration.data.user.id}`, { method: 'DELETE', headers: adminHeaders });
  record('Administrator can deactivate the public test account', removedPublicUser.status === 200, `HTTP ${removedPublicUser.status}`);

  const departments = await request('/api/departments', { headers: adminHeaders });
  record('Administrator lists academic departments', departments.status === 200 && departments.data.length >= 4, `${departments.data.length} departments`);
  const createdDepartment = await request('/api/departments', {
    method: 'POST', headers: adminHeaders,
    body: JSON.stringify({ name: `Verification Department ${unique}`, lead: 'Verification Lead', activeLabs: 1 }),
  });
  record('Administrator creates a department', createdDepartment.status === 201, createdDepartment.data.name);
  const deletedDepartment = await request(`/api/departments/${createdDepartment.data.id}`, { method: 'DELETE', headers: adminHeaders });
  record('Administrator deactivates a department', deletedDepartment.status === 200 && deletedDepartment.data.department.status === 'Inactive', `HTTP ${deletedDepartment.status}`);

  const createdAnnouncement = await request('/api/announcements', {
    method: 'POST', headers: adminHeaders,
    body: JSON.stringify({ title: `Verification Notice ${unique}`, content: 'Temporary automated verification announcement.', department: 'ICT' }),
  });
  record('Authorized staff publishes an announcement', createdAnnouncement.status === 200 || createdAnnouncement.status === 201, `HTTP ${createdAnnouncement.status}`);
  const deletedAnnouncement = await request(`/api/announcements/${createdAnnouncement.data.id}`, { method: 'DELETE', headers: adminHeaders });
  record('Administrator removes the temporary announcement', deletedAnnouncement.status === 200, `HTTP ${deletedAnnouncement.status}`);

  const newEquipment = await request('/api/equipment', {
    method: 'POST', headers: adminHeaders,
    body: JSON.stringify({ name: 'Verification Sensor Kit', assetTag: `QA-${unique}`, category: 'Testing', department: 'ICT', location: 'ICT Lab, QA Bench', modelNumber: 'QA-1', serialNumber: `QA-${unique}`, stock: 2, available: 2, status: 'Available', description: 'Temporary verification asset.' }),
  });
  record('Administrator registers equipment', newEquipment.status === 201 && newEquipment.data.stock === 2, newEquipment.data.id);
  const newQr = await request(`/api/equipment/${newEquipment.data.id}/qr`);
  record('New equipment receives a working QR code', newQr.status === 200 && newQr.data.targetUrl.endsWith(`/equipment/${newEquipment.data.id}`), newQr.data.assetTag);
  const deletedEquipment = await request(`/api/equipment/${newEquipment.data.id}`, { method: 'DELETE', headers: adminHeaders });
  record('Administrator removes temporary equipment', deletedEquipment.status === 200, `HTTP ${deletedEquipment.status}`);

  const supportUsers = await request('/api/users', { headers: auth(accounts.support.token) });
  record('IT support can administer accounts', supportUsers.status === 200, `${supportUsers.data.length} accounts`);

  const report = {
    system: 'UniGuide Rwanda', baseUrl, startedAt, completedAt: new Date().toISOString(),
    passed: results.filter((item) => item.passed).length, failed: results.filter((item) => !item.passed).length, results,
  };
  const evidenceDir = path.resolve(__dirname, '../../Book/evidence');
  fs.mkdirSync(evidenceDir, { recursive: true });
  fs.writeFileSync(path.join(evidenceDir, 'system-verification.json'), JSON.stringify(report, null, 2));
  console.log(`\n${report.passed} checks passed. Evidence: ${path.join(evidenceDir, 'system-verification.json')}`);
}

run().catch((error) => {
  console.error(`\nVerification stopped: ${error.message}`);
  process.exitCode = 1;
});
