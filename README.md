# UniGuide Rwanda

UniGuide Rwanda is a role-based university guidance and laboratory information platform developed for Tumba College of Technology. It combines equipment guidance, QR access, accessible laboratory directions, borrowing workflows, announcements, administration, and management reporting.

## Implemented Features

- Seven role-specific workspaces: Student, Lecturer, Laboratory Staff, HOD, Stock Manager, Administrator, and IT Support
- JWT authentication, hashed passwords, active-account checks, and server-side authorization
- Searchable equipment catalogue with manuals, safety resources, tutorials, stock, maintenance, and laboratory locations
- Per-equipment QR generation, download, print, copy, camera scanning, and manual asset-tag fallback
- Landmark-based and step-free guidance for four technical laboratories
- Student/lecturer borrowing requests and staff approval, issue, overdue, cancellation, and return transitions
- Transaction-safe stock deduction and restoration
- Institutional announcements, user administration, department management, accessibility preferences, and account profiles
- Live MySQL management dashboards, charts, CSV export, printable summaries, and Excel reports
- Responsive React interface served by the Express backend from one deployment

## Technology

- React 19, Vite, Tailwind CSS, React Router, Recharts
- Node.js, Express, Sequelize, MySQL
- JSON Web Tokens, bcrypt, QRCode, Multer, and ExcelJS

## Local Setup

```bash
npm ci
npm ci --prefix backend
copy backend\.env.example backend\.env
npm run build
npm start
```

For frontend development, run `npm run dev`. The backend defaults to port `5001`.

## Verification

```bash
npm run lint
npm run build
npm audit --omit=dev
npm audit --prefix backend --omit=dev
npm test
```

The automated suite verifies 38 API and workflow conditions across authentication, all seven roles, authorization boundaries, QR generation, accessible laboratory guidance, borrowing, approval/issue/return stock control, profiles, departments, announcements, reporting, users, and equipment.

## Production Configuration

The server supports `DATABASE_URL`, `MYSQL_URL`, standard `DB_*` variables, and Railway `MYSQL*` variables. Required production settings are documented in `backend/.env.example`.

`DEMO_MODE` must be `false` in production. If the database is unavailable, production startup stops instead of exposing the in-memory presentation fixture.

## Presentation Accounts

The MySQL seed creates the following academic demonstration accounts. Their password is supplied through `SEED_PASSWORD`:

- `student@uniguide.rw`
- `lecturer@uniguide.rw`
- `labstaff@uniguide.rw`
- `hod@uniguide.rw`
- `stock@uniguide.rw`
- `admin@uniguide.rw`
- `support@uniguide.rw`

Change demonstration credentials before institutional use.
