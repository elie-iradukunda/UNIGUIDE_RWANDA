const sequelize = require('./config/db');
const User = require('./models/User');
const bcrypt = require('bcryptjs');

const seedUsers = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connected for user seeding.');

    // await sequelize.sync({ alter: true });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('password123', salt);

    const usersData = [
      {
        fullName: 'Jean Uwimana',
        email: 'student@uniguide.rw',
        password: hashedPassword,
        role: 'Student',
        department: 'Mechatronic',
        studentId: 'STU-2026-014',
        avatar: 'https://ui-avatars.com/api/?name=Jean+Uwimana&background=1f4fa3&color=fff',
        canBorrow: true,
        canReserve: true,
        canViewReports: false,
        status: 'Active'
      },
      {
        fullName: 'Iradukunda David',
        email: 'hod@uniguide.rw',
        password: hashedPassword,
        role: 'HOD',
        department: 'Mechatronic',
        studentId: 'HOD-002',
        avatar: 'https://ui-avatars.com/api/?name=Iradukunda+David&background=1f4fa3&color=fff',
        canBorrow: false,
        canReserve: false,
        canViewReports: true,
        status: 'Active'
      },
      {
        fullName: 'Eric Niyonsaba',
        email: 'labstaff@uniguide.rw',
        password: hashedPassword,
        role: 'Lab Staff',
        department: 'Mechatronic',
        studentId: 'TECH-018',
        avatar: 'https://ui-avatars.com/api/?name=Eric+Niyonsaba&background=1f4fa3&color=fff',
        canBorrow: false,
        canReserve: false,
        canViewReports: false,
        status: 'Active'
      },
      {
        fullName: 'Mukandanga Claire',
        email: 'admin@uniguide.rw',
        password: hashedPassword,
        role: 'Admin',
        department: 'ICT',
        studentId: 'ADM-004',
        avatar: 'https://ui-avatars.com/api/?name=Mukandanga+Claire&background=1f4fa3&color=fff',
        canBorrow: false,
        canReserve: false,
        canViewReports: true,
        status: 'Active'
      }
    ];

    for (const data of usersData) {
      const [user, created] = await User.findOrCreate({
        where: { email: data.email },
        defaults: data
      });
      if (created) {
        console.log(`Created user: ${user.fullName} (${user.role})`);
      } else {
        console.log(`User already exists: ${user.fullName} (${user.role})`);
      }
    }

    console.log('User seeding complete!');
    process.exit(0);
  } catch (error) {
    console.error('Failed to seed users:', error);
    process.exit(1);
  }
};

seedUsers();
