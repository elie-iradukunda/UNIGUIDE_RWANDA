const bcrypt = require('bcryptjs');
const { Op } = require('sequelize');
const {
  Announcement,
  Department,
  Equipment,
  Reservation,
  User,
} = require('../models');
const demoData = require('../data/demoStore');

const normalizeDepartment = (value) => {
  const names = {
    Mechatronics: 'Mechatronic',
    Electronics: 'Electronic and Telecommunication',
    'Electronics and Telecommunication': 'Electronic and Telecommunication',
  };
  return names[value] || value || null;
};

const supportedRoles = ['Student', 'Admin', 'HOD', 'Lab Staff'];
const unsupportedRoles = ['Lecturer', 'StockManager', 'IT Support'];
const legacyEmails = [
  'lecturer@uniguide.rw',
  'support@uniguide.rw',
  'stock@uniguide.rw',
  'hod.engineering@smartuni.edu',
  'stock.manager@smartuni.edu',
];

// verify-uniguide.js registers throwaway accounts on every run, and deleteUser()
// only soft-deletes (status: Inactive), so the rows outlive the run. They carry a
// supported role, so the checks above never catch them.
const throwawayEmailPatterns = ['verify-%@uniguide.rw', 'public-%@uniguide.rw'];

async function pruneNonPresentationUsers() {
  const staleUsers = await User.findAll({
    where: {
      [Op.or]: [
        { role: { [Op.in]: unsupportedRoles } },
        { email: { [Op.in]: legacyEmails } },
        ...throwawayEmailPatterns.map((pattern) => ({ email: { [Op.like]: pattern } })),
      ],
    },
  });

  const ids = staleUsers.map((user) => user.id);
  if (ids.length) {
    await Reservation.destroy({ where: { userId: { [Op.in]: ids } } });
    await User.destroy({ where: { id: { [Op.in]: ids } } });
  }
}

async function seedUsers() {
  await pruneNonPresentationUsers();
  const password = process.env.SEED_PASSWORD || 'password123';
  const hashedPassword = await bcrypt.hash(password, 10);
  const idMap = new Map();

  for (const source of demoData.users) {
    if (!supportedRoles.includes(source.role)) continue;
    const presentationUser = {
      fullName: source.fullName,
      email: source.email.toLowerCase(),
      password: hashedPassword,
      role: source.role,
      department: normalizeDepartment(source.department),
      studentId: source.studentId || null,
      status: source.status || 'Active',
      canBorrow: source.canBorrow !== false,
      canReserve: source.canReserve !== false,
      canViewReports: Boolean(source.canViewReports),
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(source.fullName)}&background=1f5ff0&color=fff`,
    };
    const [record, created] = await User.findOrCreate({
      where: { email: source.email.toLowerCase() },
      defaults: presentationUser,
    });
    if (!created) {
      await record.update(presentationUser);
    }
    idMap.set(source.id, record.id);
  }

  return idMap;
}

async function seedEquipment() {
  const idMap = new Map();

  for (const source of demoData.equipment) {
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
  await seedReservations(userIds, equipmentIds);
  await seedAnnouncements();
  await seedDepartments();
  return {
    users: await User.count(),
    equipment: await Equipment.count(),
    reservations: await Reservation.count(),
    announcements: await Announcement.count(),
  };
}

module.exports = { seedProductionData };
