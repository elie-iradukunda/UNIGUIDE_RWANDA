const bcrypt = require('bcryptjs');
const { Op } = require('sequelize');
const {
  Announcement,
  Department,
  Equipment,
  LabLocation,
  Reservation,
  User,
} = require('../models');
const demoData = require('../data/demoStore');
const { catalogTags, normalizeEquipmentCatalog } = require('../scripts/normalize-equipment-catalog');
const { populateEquipmentLearningMaterials } = require('../scripts/populate-equipment-learning-materials');

const normalizeDepartment = (value) => {
  const names = {
    Mechatronics: 'Mechatronic',
    Electronics: 'Electronic and Telecommunication',
    'Electronics and Telecommunication': 'Electronic and Telecommunication',
  };
  return names[value] || value || null;
};

const unsupportedRoles = ['Lecturer', 'StockManager', 'IT Support'];
const legacyEmails = [
  'lecturer@uniguide.rw',
  'support@uniguide.rw',
  'stock@uniguide.rw',
  'hod.engineering@smartuni.edu',
  'stock.manager@smartuni.edu',
];

// Production runs on real accounts only. The @uniguide.rw fixtures belong to the
// offline presentation store, and verify-uniguide.js leaves throwaway accounts
// behind because deleteUser() only soft-deletes. Everything here is removed from
// the live database on every boot; real accounts are created in the admin dashboard.
const disposableEmailPatterns = ['%@uniguide.rw'];

async function pruneDisposableUsers() {
  const stale = await User.findAll({
    where: {
      [Op.or]: [
        { role: { [Op.in]: unsupportedRoles } },
        { email: { [Op.in]: legacyEmails } },
        ...disposableEmailPatterns.map((pattern) => ({ email: { [Op.like]: pattern } })),
      ],
    },
  });

  const ids = stale.map((user) => user.id);
  if (ids.length) {
    await Reservation.destroy({ where: { userId: { [Op.in]: ids } } });
    await User.destroy({ where: { id: { [Op.in]: ids } } });
  }
}

/**
 * Seed the single institutional administrator. Every other account is created from
 * the admin dashboard, so this is the only user the deploy creates.
 *
 * The password is written on first creation only. A later change made in the
 * dashboard therefore survives the next deploy instead of being reset back.
 */
async function seedAdministrator() {
  const email = String(process.env.ADMIN_EMAIL || 'iradukundaelie71@gmail.com').toLowerCase();
  const fullName = process.env.ADMIN_NAME || 'Elie Iradukunda';
  const password = process.env.ADMIN_PASSWORD || process.env.SEED_PASSWORD;

  if (!password) {
    console.warn('ADMIN_PASSWORD is not set, so the administrator account was not seeded.');
    return;
  }

  const [record, created] = await User.findOrCreate({
    where: { email },
    defaults: {
      fullName,
      email,
      password: await bcrypt.hash(password, 10),
      role: 'Admin',
      department: normalizeDepartment(process.env.ADMIN_DEPARTMENT || 'ICT'),
      status: 'Active',
      emailVerifiedAt: new Date(),
      canBorrow: false,
      canReserve: false,
      canViewReports: true,
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=1f5ff0&color=fff`,
    },
  });

  if (created) {
    console.log(`Seeded administrator ${email}.`);
    return;
  }

  // Escape hatch for a locked-out administrator. Outbound SMTP is blocked on most
  // hosting platforms, so "forgot password" cannot always be relied on to get back
  // in. Setting ADMIN_PASSWORD_RESET=true rewrites the password from ADMIN_PASSWORD
  // on the next boot. Remove the flag immediately afterwards, or every future deploy
  // will reset the password again and undo any change made in the dashboard.
  if (String(process.env.ADMIN_PASSWORD_RESET || '').toLowerCase() === 'true') {
    await record.update({
      password: await bcrypt.hash(password, 10),
      role: 'Admin',
      status: 'Active',
      canViewReports: true,
      emailVerifiedAt: record.emailVerifiedAt || new Date(),
    });
    console.warn(
      `ADMIN_PASSWORD_RESET is set: the password for ${email} was rewritten from ADMIN_PASSWORD. `
      + 'Remove ADMIN_PASSWORD_RESET now, or it will be reset again on every deploy.',
    );
    return;
  }

  if (record.role !== 'Admin' || record.status !== 'Active') {
    // Never lock the administrator out, but leave the password alone.
    await record.update({ role: 'Admin', status: 'Active', canViewReports: true });
    console.log(`Restored administrator access for ${email}.`);
  }
}

async function seedUsers() {
  await pruneDisposableUsers();
  await seedAdministrator();
  // No reservation fixtures are mapped, so production starts with real data only.
  return new Map();
}

async function seedEquipment() {
  const idMap = new Map();

  for (const source of demoData.equipment.filter((item) => catalogTags.includes(item.assetTag))) {
    const [record] = await Equipment.findOrCreate({
      where: { assetTag: source.assetTag },
      defaults: {
        name: source.name,
        modelNumber: source.modelNumber,
        category: source.category,
        department: normalizeDepartment(source.department),
        serialNumber: source.serialNumber,
        assetTag: source.assetTag,
        description: source.description,
        purchaseDate: source.purchaseDate || null,
        warrantyExpiry: source.warrantyExpiry || null,
        cost: source.cost || 0,
        requiresMaintenance: Boolean(source.requiresMaintenance),
        status: source.status || 'Available',
        location: source.location,
        stock: Number(source.stock || 1),
        available: Number(source.available ?? source.stock ?? 1),
        image: source.image,
        galleryImages: source.galleryImages || [],
        videoUrls: source.videoUrls || [],
        manualUrl: source.manualUrl,
        safetyManualUrl: source.safetyManualUrl,
        learningMaterials: source.learningMaterials || [],
      },
    });
    idMap.set(source.id, record.id);
  }

  return idMap;
}

async function seedReservations(userIds, equipmentIds) {
  if (await Reservation.count() > 0) return;

  for (const source of demoData.reservations) {
    const userId = userIds.get(source.userId);
    const equipmentId = equipmentIds.get(source.equipmentId);
    if (!userId || !equipmentId) continue;
    await Reservation.create({
      userId,
      equipmentId,
      startDate: source.startDate,
      endDate: source.endDate,
      status: source.status,
      purpose: source.purpose,
      moduleCode: source.moduleCode,
      phoneNumber: source.phoneNumber,
    });
  }
}

async function seedAnnouncements() {
  for (const source of demoData.announcements) {
    await Announcement.findOrCreate({
      where: { title: source.title },
      defaults: {
        title: source.title,
        content: source.content,
        department: normalizeDepartment(source.department) || 'All Departments',
        authorName: source.authorName,
        isNew: source.isNew !== false,
      },
    });
  }
}

/**
 * The four laboratory guides used to live in a hardcoded array. Load them once so the
 * existing directions survive, then leave them alone: staff edit them in the app, and
 * a redeploy must not overwrite a correction somebody made on the ground.
 */
async function seedLabLocations() {
  if (await LabLocation.count() > 0) return;

  for (const source of demoData.labLocations) {
    await LabLocation.create({
      name: source.name,
      department: normalizeDepartment(source.department),
      building: source.building,
      floor: source.floor,
      room: source.room,
      landmarks: source.landmarks || [],
      accessibleRoute: source.accessibleRoute,
      accessibility: source.accessibility || [],
      openingHours: source.openingHours,
      contact: source.contact,
    });
  }
}

async function seedDepartments() {
  const departments = [
    { name: 'Mechatronics', lead: 'Iradukunda David', activeLabs: 4 },
    { name: 'ICT', lead: 'Mukandanga Claire', activeLabs: 5 },
    { name: 'Renewable Energy', lead: 'Yvonne Keza', activeLabs: 3 },
    { name: 'Electronics and Telecommunication', lead: 'Eric Niyonsaba', activeLabs: 2 },
  ];
  for (const department of departments) {
    await Department.findOrCreate({ where: { name: department.name }, defaults: department });
  }
}

async function seedProductionData() {
  const userIds = await seedUsers();
  const equipmentIds = await seedEquipment();
  await normalizeEquipmentCatalog();
  await populateEquipmentLearningMaterials();
  await seedReservations(userIds, equipmentIds);
  await seedAnnouncements();
  await seedDepartments();
  await seedLabLocations();
  return {
    users: await User.count(),
    equipment: await Equipment.count(),
    reservations: await Reservation.count(),
    announcements: await Announcement.count(),
    labLocations: await LabLocation.count(),
  };
}

module.exports = { seedProductionData };
