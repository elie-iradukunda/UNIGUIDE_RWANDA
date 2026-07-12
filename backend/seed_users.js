const bcrypt = require('bcryptjs');
const sequelize = require('./config/db');
const User = require('./models/User');

async function seedUsers() {
  try {
    await sequelize.authenticate();
    console.log('Connection has been established successfully.');
    
    // Make sure tables are created
    await sequelize.sync();

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('password123', salt);

    const users = [
      {
        fullName: 'Jean Uwimana',
        email: 'student@uniguide.rw',
        password: hashedPassword,
        role: 'Student',
        department: 'Mechatronic',
        studentId: 'STU-2026-001'
      },
      {
        fullName: 'Iradukunda David',
        email: 'hod@uniguide.rw',
        password: hashedPassword,
        role: 'HOD',
        department: 'Mechatronic',
        studentId: 'HOD-002',
        canBorrow: false,
        canReserve: false,
        canViewReports: true
      },
      {
        fullName: 'Eric Niyonsaba',
        email: 'labstaff@uniguide.rw',
        password: hashedPassword,
        role: 'Lab Staff',
        department: 'Mechatronic',
        studentId: 'TECH-018',
        canBorrow: false,
        canReserve: false
      },
      {
        fullName: 'Mukandanga Claire',
        email: 'admin@uniguide.rw',
        password: hashedPassword,
        role: 'Admin',
        department: 'ICT',
        studentId: 'ADM-004',
        canBorrow: false,
        canReserve: false,
        canViewReports: true
      }
    ];

    for (const u of users) {
      const existing = await User.findOne({ where: { email: u.email } });
      if (!existing) {
        await User.create(u);
        console.log(`Created user: ${u.fullName} (${u.role})`);
      } else {
        console.log(`User already exists: ${u.fullName}`);
      }
    }

    console.log('\n--- Test Accounts ---');
    console.log('Password for all accounts: password123');
    users.forEach(u => console.log(`- ${u.role}: ${u.email}`));
    
    process.exit(0);
  } catch (error) {
    console.error('Unable to connect to the database or create users:', error);
    process.exit(1);
  }
}

seedUsers();
