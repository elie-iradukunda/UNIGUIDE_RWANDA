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
    student: 'student@uniguide.rw',
    hod: 'hod@uniguide.rw',
    labStaff: 'labstaff@uniguide.rw',
    admin: 'admin@uniguide.rw',
  })) accounts[role] = await login(email);
  const unique = Date.now();

  // Registration is gated twice: the email must sit on an approved domain, and the
  // student ID must appear on the college enrolment list and still be unclaimed.
  const outsider = await request('/api/auth/register', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fullName: 'Outside Applicant', email: `outsider-${unique}@example.com`, password: 'Temporary123', studentId: 'STU-2026-015' }),
  });
  record('Registration is refused for a non-college email domain', outsider.status === 403, `HTTP ${outsider.status}`);

  const notEnrolled = await request('/api/auth/register', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fullName: 'Not Enrolled', email: `ghost-${unique}@uniguide.rw`, password: 'Temporary123', studentId: `GHOST-${unique}` }),
  });
  record('Registration is refused for a student ID that is not enrolled', notEnrolled.status === 403, `HTTP ${notEnrolled.status}`);

  const withdrawn = await request('/api/auth/register', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fullName: 'Withdrawn Student', email: `withdrawn-${unique}@uniguide.rw`, password: 'Temporary123', studentId: 'STU-2025-088' }),
  });
  record('Registration is refused for a withdrawn student', withdrawn.status === 403, `HTTP ${withdrawn.status}`);

  const claimed = await request('/api/auth/register', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fullName: 'Impostor', email: `impostor-${unique}@uniguide.rw`, password: 'Temporary123', studentId: 'STU-2026-014' }),
  });
  record('A student ID already used to open an account cannot be reused', claimed.status === 409, `HTTP ${claimed.status}`);

  // STU-2026-015 is enrolled in ICT. The applicant asks for Mechatronic; the roster wins.
  const publicEmail = `public-${unique}@uniguide.rw`;
  const publicRegistration = await request('/api/auth/register', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fullName: 'Public Verification Student', email: publicEmail, password: 'Temporary123', role: 'Admin', department: 'Mechatronic', studentId: 'STU-2026-015' }),
  });
  record('Registration issues a one-time password instead of a session', publicRegistration.status === 201 && !publicRegistration.data.token, `HTTP ${publicRegistration.status}`);

  const unverifiedLogin = await request('/api/auth/login', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: publicEmail, password: 'Temporary123' }),
  });
  record('Unverified account cannot sign in', unverifiedLogin.status === 403 && unverifiedLogin.data.requiresVerification === true, `HTTP ${unverifiedLogin.status}`);

  const wrongCode = await request('/api/auth/verify-otp', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: publicEmail, code: '000000' }),
  });
  record('An incorrect one-time password is rejected', wrongCode.status === 400, `HTTP ${wrongCode.status}`);

  const verified = await request('/api/auth/verify-otp', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: publicEmail, code: publicRegistration.data.devCode }),
  });
  record('Correct one-time password activates the account', verified.status === 200 && Boolean(verified.data.token), `HTTP ${verified.status}`);
  record('Public registration cannot grant an elevated role', verified.data.user.role === 'Student', verified.data.user.role);
  record('Department is taken from the enrolment list, not the sign-up form', verified.data.user.department === 'ICT', `asked for Mechatronic, received ${verified.data.user.department}`);

  const rosterAfterClaim = await request('/api/roster', { headers: auth(accounts.admin.token) });
  const claimedEntry = (rosterAfterClaim.data.entries || []).find((entry) => entry.studentId === 'STU-2026-015');
  record('The enrolment record is marked as claimed', rosterAfterClaim.status === 200 && claimedEntry?.claimedByEmail === publicEmail, claimedEntry?.claimedByEmail || 'not claimed');

  const studentRosterDenied = await request('/api/roster', { headers: auth(accounts.student.token) });
  record('Students cannot read the enrolment list', studentRosterDenied.status === 403, `HTTP ${studentRosterDenied.status}`);

  const profileUpdate = await request('/api/auth/me', {
    method: 'PATCH', headers: auth(verified.data.token, { 'Content-Type': 'application/json' }),
    body: JSON.stringify({ fullName: 'Updated Verification Student', email: publicEmail }),
  });
  record('Authenticated user updates own profile', profileUpdate.status === 200 && profileUpdate.data.fullName === 'Updated Verification Student', `HTTP ${profileUpdate.status}`);

  const denied = await request('/api/users');
  record('Anonymous access is rejected', denied.status === 401, `HTTP ${denied.status}`);
  const anonymousAnnouncement = await request('/api/announcements', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: 'Unauthorized', content: 'Must not be created.' }),
  });
  record('Anonymous announcement publishing is rejected', anonymousAnnouncement.status === 401, `HTTP ${anonymousAnnouncement.status}`);

  const equipment = await request('/api/equipment?limit=50');
  const equipmentRows = equipment.data.equipment || equipment.data;
  record('Equipment catalogue is available', equipment.status === 200 && equipmentRows.length >= 6, `${equipmentRows.length} assets`);

  const qr = await request(`/api/equipment/${equipmentRows[0].id}/qr`);
  record('Equipment QR PNG is generated', qr.status === 200 && qr.data.dataUrl.startsWith('data:image/png;base64,'), qr.data.assetTag);

  const locations = await request('/api/lab-locations');
  record('Accessible laboratory guidance is available', locations.status === 200 && locations.data.every((lab) => lab.accessibleRoute && lab.landmarks.length), `${locations.data.length} laboratories`);

  // Laboratory guides are records now, so staff can add and correct them in the app.
  const anonymousLab = await request('/api/lab-locations', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Unauthorized Lab', department: 'ICT' }),
  });
  record('Anonymous laboratory-guide creation is rejected', anonymousLab.status === 401, `HTTP ${anonymousLab.status}`);

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
  record('Lab staff reviews department reservation queue', allReservations.status === 200 && allReservations.data.every((row) => row.Equipment?.department === accounts.labStaff.user.department), `${allReservations.data.length} department records`);
  const workflowEquipment = equipmentRows.find((item) => item.department === accounts.labStaff.user.department && item.available > 0);
  record('Department equipment is available for staff workflow verification', Boolean(workflowEquipment), workflowEquipment?.assetTag || 'none');
  const staffWorkflowReservation = await request('/api/reservations', {
    method: 'POST', headers: studentHeaders,
    body: JSON.stringify({ equipmentId: workflowEquipment.id, purpose: 'Automated verification of staff approval workflow.', startDate: '2026-07-16', endDate: '2026-07-17', moduleCode: 'QA402', phoneNumber: '+250788000001' }),
  });
  record('Student creates a reservation for staff workflow', staffWorkflowReservation.status === 201 && staffWorkflowReservation.data.status === 'Pending', staffWorkflowReservation.data.id);
  const refreshedReservations = await request('/api/reservations/all', { headers: staffHeaders });
  const pendingWorkflow = refreshedReservations.data.find((row) => row.id === staffWorkflowReservation.data.id);
  record('Lab staff sees the new department reservation', refreshedReservations.status === 200 && Boolean(pendingWorkflow), pendingWorkflow?.id || 'not visible');
  let workflow = await request(`/api/reservations/${pendingWorkflow.id}`, { method: 'PATCH', headers: staffHeaders, body: JSON.stringify({ status: 'Approved', reason: 'Verification approval note.' }) });
  workflow = await request(`/api/reservations/${pendingWorkflow.id}`, { method: 'PATCH', headers: staffHeaders, body: JSON.stringify({ status: 'Borrowed' }) });
  const borrowedStock = (await request(`/api/equipment/${pendingWorkflow.Equipment.id}`)).data.available;
  workflow = await request(`/api/reservations/${pendingWorkflow.id}`, { method: 'PATCH', headers: staffHeaders, body: JSON.stringify({ status: 'Returned' }) });
  const returnedStock = (await request(`/api/equipment/${pendingWorkflow.Equipment.id}`)).data.available;
  record('Approval, issue, and return workflow updates stock', workflow.status === 200 && workflow.data.status === 'Returned' && returnedStock === borrowedStock + 1, `${borrowedStock} → ${returnedStock} available`);

  // A student may borrow from any department; the request is reviewed by the staff who
  // own the equipment, not by the student's own department.
  const foreignEquipment = equipmentRows.find((item) => item.department !== accounts.student.user.department && item.available > 0);
  record('Equipment exists outside the student\'s own department', Boolean(foreignEquipment), foreignEquipment ? `${foreignEquipment.assetTag} (${foreignEquipment.department})` : 'none');
  const crossRequest = await request('/api/reservations', {
    method: 'POST', headers: studentHeaders,
    body: JSON.stringify({ equipmentId: foreignEquipment.id, purpose: 'Cross-department borrowing verification.', startDate: '2026-07-18', endDate: '2026-07-19', moduleCode: 'QA403', phoneNumber: '+250788000002' }),
  });
  record('Student borrows equipment from another department', crossRequest.status === 201 && crossRequest.data.status === 'Pending', `${accounts.student.user.department} student -> ${foreignEquipment.department} asset`);

  const staffQueue = await request('/api/reservations/all', { headers: staffHeaders });
  const crossVisibleToWrongStaff = staffQueue.data.some((row) => row.id === crossRequest.data.id);
  record('Staff of another department cannot see that request', staffQueue.status === 200 && !crossVisibleToWrongStaff, `${foreignEquipment.department} asset hidden from ${accounts.labStaff.user.department} staff`);

  const wrongStaffDecision = await request(`/api/reservations/${crossRequest.data.id}`, {
    method: 'PATCH', headers: staffHeaders,
    body: JSON.stringify({ status: 'Approved', reason: 'Should not be permitted.' }),
  });
  record('Staff of another department cannot approve that request', wrongStaffDecision.status === 403, `HTTP ${wrongStaffDecision.status}`);

  const ownerQueue = await request('/api/reservations/all', { headers: auth(accounts.admin.token) });
  record('The owning department sees the cross-department request', ownerQueue.status === 200 && ownerQueue.data.some((row) => row.id === crossRequest.data.id), 'visible to the equipment owner');
  const requesterRow = ownerQueue.data.find((row) => row.id === crossRequest.data.id);
  record('The reviewer sees which department the student comes from', requesterRow?.User?.department === accounts.student.user.department, requesterRow?.User?.department || 'unknown');

  const hodReports = await request('/api/dashboard/reports', { headers: auth(accounts.hod.token) });
  record('HOD opens management reports', hodReports.status === 200 && hodReports.data.stats.totalEquipment >= 6, `${hodReports.data.stats.totalReservations} reservations`);

  const adminHeaders = auth(accounts.admin.token, { 'Content-Type': 'application/json' });
  const users = await request('/api/users', { headers: adminHeaders });
  record('Administrator lists user accounts', users.status === 200 && users.data.length >= 4, `${users.data.length} accounts`);

  const staffEquipment = await request('/api/equipment', {
    method: 'POST', headers: staffHeaders,
    body: JSON.stringify({ name: 'Technician Verification Meter', assetTag: `TECH-${unique}`, category: 'Testing', department: 'ICT', location: 'Mechatronics Lab QA Bench', modelNumber: 'TECH-1', serialNumber: `TECH-${unique}`, stock: 1, available: 1, status: 'Available', description: 'Temporary technician verification asset.' }),
  });
  record('Lab Staff registers equipment in their department', staffEquipment.status === 201 && staffEquipment.data.department === accounts.labStaff.user.department, staffEquipment.data.department);
  const hodEquipment = await request('/api/equipment', {
    method: 'POST', headers: auth(accounts.hod.token, { 'Content-Type': 'application/json' }),
    body: JSON.stringify({ name: 'HOD Verification Kit', assetTag: `HOD-${unique}`, category: 'Testing', department: 'ICT', location: 'Department QA Bench', modelNumber: 'HOD-1', serialNumber: `HOD-${unique}`, stock: 1, available: 1, status: 'Available', description: 'Temporary HOD verification asset.' }),
  });
  record('HOD registers equipment in their department', hodEquipment.status === 201 && hodEquipment.data.department === accounts.hod.user.department, hodEquipment.data.department);
  const deletedStaffEquipment = await request(`/api/equipment/${staffEquipment.data.id}`, { method: 'DELETE', headers: adminHeaders });
  record('Administrator removes temporary staff equipment', deletedStaffEquipment.status === 200, `HTTP ${deletedStaffEquipment.status}`);
  const deletedHodEquipment = await request(`/api/equipment/${hodEquipment.data.id}`, { method: 'DELETE', headers: adminHeaders });
  record('Administrator removes temporary HOD equipment', deletedHodEquipment.status === 200, `HTTP ${deletedHodEquipment.status}`);

  const createdUser = await request('/api/users', {
    method: 'POST', headers: adminHeaders,
    body: JSON.stringify({ fullName: 'Verification User', email: `verify-${unique}@uniguide.rw`, password: 'Temporary123', role: 'Student', department: 'ICT', studentId: `VERIFY-${unique}`, status: 'Active' }),
  });
  record('Administrator creates a user', createdUser.status === 201 && createdUser.data.fullName === 'Verification User', createdUser.data.id);
  const updatedUser = await request(`/api/users/${createdUser.data.id}`, { method: 'PATCH', headers: adminHeaders, body: JSON.stringify({ status: 'Inactive' }) });
  record('Administrator updates account status', updatedUser.status === 200 && updatedUser.data.status === 'Inactive', updatedUser.data.id);
  const deletedUser = await request(`/api/users/${createdUser.data.id}`, { method: 'DELETE', headers: adminHeaders });
  record('Administrator deactivates or removes a user', deletedUser.status === 200, `HTTP ${deletedUser.status}`);
  const removedPublicUser = await request(`/api/users/${verified.data.user.id}`, { method: 'DELETE', headers: adminHeaders });
  record('Administrator can deactivate the public test account', removedPublicUser.status === 200, `HTTP ${removedPublicUser.status}`);

  // Laboratory guides: staff create them in their own department, and only there.
  const staffLab = await request('/api/lab-locations', {
    method: 'POST', headers: staffHeaders,
    body: JSON.stringify({
      name: `Verification Lab ${unique}`,
      department: accounts.labStaff.user.department,
      building: 'Engineering Block',
      floor: 'Ground Floor',
      room: `V-${unique}`,
      landmarks: 'Enter by the north gate\nTurn left at the store',
      accessibleRoute: 'Step-free from the north ramp, 20 metres straight ahead.',
      accessibility: 'Step-free entrance\nWide doorway',
      openingHours: 'Monday-Friday, 08:00-17:00',
      contact: '0788 000 000',
    }),
  });
  record('Lab Staff creates a laboratory guide in their department', staffLab.status === 201 && staffLab.data.landmarks.length === 2, staffLab.data.department);

  const foreignLab = await request('/api/lab-locations', {
    method: 'POST', headers: staffHeaders,
    body: JSON.stringify({ name: 'Out-of-department Lab', department: 'ICT' }),
  });
  record('Lab Staff cannot create a laboratory in another department', foreignLab.status === 403, `HTTP ${foreignLab.status}`);

  const editedLab = await request(`/api/lab-locations/${staffLab.data.id}`, {
    method: 'PATCH', headers: staffHeaders,
    body: JSON.stringify({ openingHours: 'Monday-Saturday, 07:00-19:00' }),
  });
  record('Lab Staff edits their laboratory guide', editedLab.status === 200 && editedLab.data.openingHours === 'Monday-Saturday, 07:00-19:00', editedLab.data.openingHours);

  const studentLabEdit = await request(`/api/lab-locations/${staffLab.data.id}`, {
    method: 'PATCH', headers: studentHeaders, body: JSON.stringify({ name: 'Hacked' }),
  });
  record('Students cannot edit a laboratory guide', studentLabEdit.status === 403, `HTTP ${studentLabEdit.status}`);

  const removedLab = await request(`/api/lab-locations/${staffLab.data.id}`, { method: 'DELETE', headers: staffHeaders });
  record('Lab Staff removes their laboratory guide', removedLab.status === 200, `HTTP ${removedLab.status}`);

  const importedRoster = await request('/api/roster/import', {
    method: 'POST', headers: adminHeaders,
    body: JSON.stringify({ csv: `Student ID,Name,Department\nIMP-${unique},Imported Student,ICT` }),
  });
  record('Administrator imports the registry export', importedRoster.status === 201 && importedRoster.data.added === 1, importedRoster.data.message);
  const importedEntry = (await request('/api/roster', { headers: adminHeaders })).data.entries.find((entry) => entry.studentId === `IMP-${unique}`);
  const removedRosterEntry = await request(`/api/roster/${importedEntry.id}`, { method: 'DELETE', headers: adminHeaders });
  record('Administrator removes an unclaimed enrolment record', removedRosterEntry.status === 200, `HTTP ${removedRosterEntry.status}`);

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
