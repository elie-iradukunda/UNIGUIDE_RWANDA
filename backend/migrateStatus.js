const sequelize = require('./config/db');

const migrateStatus = async () => {
  try {
    await sequelize.authenticate();
    console.log('Connected to database.');

    // For MariaDB/MySQL: Change the ENUM column to VARCHAR
    await sequelize.query(`ALTER TABLE Equipment MODIFY COLUMN status VARCHAR(255) DEFAULT 'Available';`);
    console.log('Changed status column from ENUM to VARCHAR.');

    // Set null statuses to 'Available'
    await sequelize.query(`UPDATE Equipment SET status = 'Available' WHERE status IS NULL OR status = '';`);
    console.log('Fixed null/empty status values.');

    console.log('✅ Migration complete! Status column is now VARCHAR.');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error.message);
    process.exit(1);
  }
};

migrateStatus();
