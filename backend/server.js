const dotenv = require('dotenv');
dotenv.config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { DataTypes } = require('sequelize');
const sequelize = require('./config/db');
require('./models');
const { handleDemo } = require('./data/demoStore');
const { seedProductionData } = require('./services/productionSeedService');

// Idempotent schema patches for columns added after the initial deploy.
// sequelize.sync() creates missing tables but never adds new columns to
// existing ones, so newly-added model fields must be backfilled here.
async function ensureSchema() {
  const qi = sequelize.getQueryInterface();
  try {
    const reservations = await qi.describeTable('Reservations');
    if (!reservations.decisionReason) {
      await qi.addColumn('Reservations', 'decisionReason', { type: DataTypes.TEXT, allowNull: true });
      console.log('Schema patch: added Reservations.decisionReason column.');
    }
  } catch (error) {
    console.warn(`Schema patch skipped: ${error.message}`);
  }

  try {
    const users = await qi.describeTable('Users');
    if (!users.emailVerifiedAt) {
      await qi.addColumn('Users', 'emailVerifiedAt', { type: DataTypes.DATE, allowNull: true });
      console.log('Schema patch: added Users.emailVerifiedAt column.');
    }
    // sync() does not widen an existing ENUM either, so 'Pending' has to be added
    // explicitly or every OTP registration fails on a truncated-data error.
    if (users.status && !String(users.status.type || '').toLowerCase().includes("'pending'")) {
      await qi.changeColumn('Users', 'status', {
        type: DataTypes.ENUM('Active', 'Offline', 'Inactive', 'Pending'),
        defaultValue: 'Active',
      });
      console.log("Schema patch: added 'Pending' to the Users.status enum.");
    }
  } catch (error) {
    console.warn(`User schema patch skipped: ${error.message}`);
  }
}

const app = express();
app.set('trust proxy', 1);

// CORS Configuration
const allowedOrigins = [
  'http://localhost:5173',  // Vite dev server
  'http://localhost:3000',
  process.env.FRONTEND_URL,
  process.env.RAILWAY_PUBLIC_DOMAIN ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}` : null,
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    // Allow if origin matches allowed list, is a local Vite dev port, or is a vercel.app domain
    if (
      allowedOrigins.includes(origin) ||
      /^http:\/\/localhost:\d+$/.test(origin) ||
      origin.endsWith('.vercel.app')
    ) {
      return callback(null, true);
    }
    callback(null, false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));


app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health check endpoint
app.get('/api/health', (req, res) => res.json({ status: 'ok', app: 'UniGuide API', mode: app.locals.dataMode || 'starting' }));

const PORT = process.env.PORT || 5001;
const frontendDist = path.resolve(__dirname, '../dist');

function mountDatabaseRoutes() {
  app.use('/api/auth', require('./routes/authRoutes'));
  app.use('/api/equipment', require('./routes/equipmentRoutes'));
  app.use('/api/reservations', require('./routes/reservationRoutes'));
  app.use('/api/users', require('./routes/userRoutes'));
  app.use('/api/dashboard', require('./routes/dashboardRoutes'));
  app.use('/api/upload', require('./routes/uploadRoutes'));
  app.use('/api/requests', require('./routes/equipmentRequestRoutes'));
  app.use('/api/lab-assignments', require('./routes/labAssignmentRoutes'));
  app.use('/api/announcements', require('./routes/announcements'));
  app.use('/api/departments', require('./routes/departmentRoutes'));
  app.use('/api/roster', require('./routes/rosterRoutes'));
  app.use('/api/lab-locations', require('./routes/labLocationRoutes'));
}

async function start() {
  if (process.env.NODE_ENV === 'production' && (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32)) {
    console.error('Production requires a JWT_SECRET of at least 32 characters.');
    process.exitCode = 1;
    return;
  }

  if (process.env.DEMO_MODE === 'true') {
    app.locals.dataMode = 'presentation';
    app.use('/api', async (req, res) => {
      try {
        await handleDemo(req, res);
      } catch (error) {
        if (!res.headersSent) res.status(500).json({ message: 'Unexpected server error.', error: error.message });
      }
    });
    console.log('UniGuide deterministic presentation datastore enabled.');
  } else {
  try {
    await sequelize.authenticate();
    await sequelize.sync();
    await ensureSchema();
    const seeded = await seedProductionData();
    app.locals.dataMode = 'mysql';
    mountDatabaseRoutes();
    console.log(`MySQL connected and schema synchronized (${seeded.users} users, ${seeded.equipment} equipment records).`);
  } catch (error) {
    if (process.env.NODE_ENV === 'production' && process.env.ALLOW_DEMO_FALLBACK !== 'true') {
      console.error(`Production startup stopped because MySQL is unavailable: ${error.message}`);
      process.exitCode = 1;
      return;
    }
    app.locals.dataMode = 'demonstration';
    app.use('/api', (req, res) => handleDemo(req, res));
    console.warn(`MySQL unavailable; UniGuide demonstration store enabled (${error.message}).`);
  }
  }

  app.use(express.static(frontendDist));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) return next();
    return res.sendFile(path.join(frontendDist, 'index.html'));
  });
  app.use((error, req, res, next) => {
    if (res.headersSent) return next(error);
    return res.status(500).json({ message: error.message || 'Unexpected server error.' });
  });
  app.listen(PORT, '0.0.0.0', () => console.log(`UniGuide server running on http://localhost:${PORT}`));
}

start();
