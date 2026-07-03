const { Sequelize } = require('sequelize');
const dotenv = require('dotenv');

dotenv.config();

let sequelize;

// Cloud providers give a DATABASE_URL or MYSQL_URL
if (process.env.DATABASE_URL || process.env.MYSQL_URL) {
  const dbUrl = process.env.DATABASE_URL || process.env.MYSQL_URL;
  const useSSL = process.env.DB_SSL === 'true';
  sequelize = new Sequelize(dbUrl, {
    dialect: 'mysql',
    logging: false,
    dialectOptions: useSSL ? {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    } : {}
  });
} else {
  // Local development fallback
  sequelize = new Sequelize(
    process.env.DB_NAME || process.env.MYSQLDATABASE || 'uniguide',
    process.env.DB_USER || process.env.MYSQLUSER || 'root',
    process.env.DB_PASS || process.env.DB_PASSWORD || process.env.MYSQLPASSWORD || '',
    {
      host: process.env.DB_HOST || process.env.MYSQLHOST || 'localhost',
      port: Number(process.env.DB_PORT || process.env.MYSQLPORT || 3306),
      dialect: 'mysql',
      logging: false,
      pool: {
        max: Number(process.env.DB_POOL_MAX || 5),
        min: 0,
        acquire: 30000,
        idle: 10000,
      },
    }
  );
}

module.exports = sequelize;
