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
        fullName: 'Central Store Manager',
        email: 'storemanager@smartuni.edu',
        password: hashedPassword,
        role: 'StockManager',
        department: null,
        avatar: 'https://ui-avatars.com/api/?name=Central+Store+Manager&background=1f4fa3&color=fff',
        canBorrow: true,
        canReserve: true,
        canViewReports: true,
        status: 'Active'
      },
      {
        fullName: 'Engineering HOD',
        email: 'hod.engineering@smartuni.edu',
        password: hashedPassword,
        role: 'HOD',
        department: 'Mechatronic',
        avatar: 'https://ui-avatars.com/api/?name=Engineering+HOD&background=1f4fa3&color=fff',
        canBorrow: true,
        canReserve: true,
        canViewReports: true,
        status: 'Active'
      },
      {
        fullName: 'Mechatronics Lab Technician',
        email: 'labtech.mech@smartuni.edu',
        password: hashedPassword,
        role: 'Lab Staff',
        department: 'Mechatronic',
        avatar: 'https://ui-avatars.com/api/?name=Mech+Lab+Tech&background=1f4fa3&color=fff',
        canBorrow: true,
        canReserve: true,
        canViewReports: false,
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
