https://loopr-dashboard.vercel.app/dashboard


# Loopr — Financial Analytics Dashboard

A full-stack financial analytics application built for the Loopr Full-Stack Assignment. Analysts can log in, explore revenue/expense trends and KPIs on an interactive dashboard, search/filter/sort transactions, and export a configurable CSV report that downloads directly through the browser.

**Stack:** React + TypeScript + Material UI + Recharts (frontend) · Node.js + Express + TypeScript + MongoDB/Mongoose + JWT (backend)

---

## Table of Contents

1. [Why this stack](#why-this-stack)
2. [Architecture](#architecture)
3. [Features](#features)
4. [Project structure](#project-structure)
5. [Getting started (local setup)](#getting-started-local-setup)
6. [Environment variables](#environment-variables)
7. [Seeding the database](#seeding-the-database)
8. [API documentation](#api-documentation)
9. [Postman collection](#postman-collection)
10. [Deployment guide](#deployment-guide)
11. [Design decisions & trade-offs](#design-decisions--trade-offs)
12. [Possible future improvements](#possible-future-improvements)

---

## Why this stack

The assignment brief explicitly recommends React + TypeScript, Chart.js/Recharts, an MUI-family UI library, Node.js + TypeScript, MongoDB, and JWT — so this project uses that exact combination rather than introducing an unnecessary framework:

- **React + TypeScript (Vite)** — type safety end-to-end, fast dev server, and a build tool that produces a lean static bundle for easy deployment (Vercel/Netlify).
- **Material UI (MUI)** — a mature component library with built-in accessibility, theming, and the exact primitives this assignment needs out of the box (`Table`, `TableSortLabel`, `Dialog`, `Snackbar/Alert`), which keeps the code focused on business logic instead of re-inventing UI primitives.
- **Recharts** — composable, React-idiomatic charting that plays nicely with TypeScript and responsive containers.
- **Node.js + Express + TypeScript** — a minimal, well-understood REST layer. Express keeps the controller/route/middleware separation explicit, which is exactly what a reviewer will be scanning for under "code quality."
- **MongoDB + Mongoose** — the dataset (transactions) is naturally document-shaped and benefits from MongoDB's aggregation pipeline for the dashboard's summary/KPI/trend calculations, which would otherwise require multiple SQL joins/subqueries.
- **JWT** — stateless auth that's simple to reason about and to test via Postman, matching the brief's requirement exactly.

## Architecture

```
┌─────────────────┐        HTTPS / JSON        ┌──────────────────────┐        ┌─────────────┐
│   React SPA      │ ─────────────────────────▶ │  Express REST API     │ ─────▶ │  MongoDB     │
│  (Vite + MUI)     │ ◀───────────────────────── │  (Node + TypeScript)  │ ◀───── │  (Mongoose)  │
└─────────────────┘        JWT in header         └──────────────────────┘        └─────────────┘
```

- The frontend never talks to MongoDB directly — all reads/writes go through the authenticated REST API.
- JWT is issued on login and stored in `localStorage`; every request attaches it via an Axios interceptor. A global `401` handler force-logs-out the user if the token is invalid/expired.
- Filtering, sorting, search, and pagination are all handled **server-side** (via Mongo query + aggregation), not client-side, so the app scales past a few hundred rows without shipping the entire collection to the browser.
- CSV export re-uses the exact same filter contract as the transaction list, so "export what I'm looking at" works without extra plumbing.

## Features

### Authentication & Security
- JWT-based login (register endpoint also provided for creating additional analyst accounts)
- Passwords hashed with bcrypt, never returned in API responses
- Protected routes via middleware; expired/invalid tokens are rejected with `401`
- `helmet` for secure HTTP headers, rate limiting on auth routes, CORS locked to the configured frontend origin

### Financial Dashboard
- KPI cards: Total Revenue, Total Expense, Net Balance, Transaction Count, Pending Count
- Revenue vs Expense trend (line chart, grouped by month) via MongoDB aggregation
- Category breakdown (donut chart)
- All dashboard numbers respect the currently applied filters

### Transaction Table
- Server-side pagination (10/25/50/100 rows per page)
- Column sorting (date, amount, category, status, user) with visual indicator
- Real-time search across user, category, and status
- Multi-field filters: category, status, user, date range, amount range

### CSV Export System (the "be creative" feature)
- A dedicated **Export modal** where the user:
  - Picks exactly which columns to include (checkboxes, with Select All / Deselect All)
  - Reorders the selected columns (the export respects that order)
  - Sees a **live preview of the CSV header row** before downloading
  - Names the output file
- The export always respects whatever filters are active on the dashboard at the time
- File downloads automatically via a Blob + programmatic `<a download>` click — no extra user steps
- Backend caps exports at 50,000 rows to keep the request responsive (documented, adjustable)

### Error Handling
- A global **alert chip system** (`AlertContext`) surfaces success/error/warning toasts in the top-right corner for every API failure (bad login, network error, export failure, no matching rows, etc.), auto-dismissing after 5 seconds
- Centralized backend error handler returns consistent `{ success, message }` shapes, with stack traces only in development

## Project structure

```
loopr-dashboard/
├── backend/
│   ├── src/
│   │   ├── config/db.ts
│   │   ├── controllers/          # auth, transaction, export business logic
│   │   ├── middleware/           # JWT auth guard, centralized error handler
│   │   ├── models/               # User, Transaction (Mongoose schemas)
│   │   ├── routes/               # /api/auth, /api/transactions, /api/export
│   │   ├── seed/                 # seed.ts + transactions.json (sample data)
│   │   ├── utils/generateToken.ts
│   │   └── index.ts              # app entry point
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── api/axios.ts          # HTTP client + interceptors
│   │   ├── components/           # FilterBar, ChartsSection, TransactionTable, ExportModal
│   │   ├── context/              # AuthContext, AlertContext
│   │   ├── pages/                # Login, Dashboard
│   │   ├── theme/theme.ts
│   │   └── App.tsx / main.tsx
│   ├── .env.example
│   └── package.json
├── docs/
│   └── API.md                    # full endpoint reference
├── postman/
│   └── Loopr-Dashboard.postman_collection.json
└── README.md                     # you are here
```

## Getting started (local setup)

### Prerequisites
- Node.js 18+ and npm
- A MongoDB instance — either:
  - Local MongoDB (`mongod` running on `localhost:27017`), or
  - A free [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register) cluster (recommended if you don't want to install MongoDB locally)

### 1. Clone and install

```bash
git clone <your-repo-url> loopr-dashboard
cd loopr-dashboard

# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 2. Configure environment variables

```bash
# from /backend
cp .env.example .env
# edit .env: set MONGO_URI (local or Atlas connection string) and a real JWT_SECRET

# from /frontend
cp .env.example .env
# defaults to http://localhost:5000/api which matches the backend default port
```

### 3. Seed the database

```bash
# from /backend
npm run seed
```

This loads the 300 sample transactions provided with the assignment and creates a demo admin account:

```
Email:    admin@loopr.dev
Password: Admin@12345
```

(Change `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` in `.env` before seeding if you want different credentials.)

### 4. Run both apps

```bash
# Terminal 1 — backend (http://localhost:5000)
cd backend
npm run dev

# Terminal 2 — frontend (http://localhost:5173)
cd frontend
npm run dev
```

Visit `http://localhost:5173`, log in with the seeded credentials, and you're in.

### 5. Production build (optional, for deployment)

```bash
# backend
cd backend
npm run build && npm start

# frontend
cd frontend
npm run build   # outputs static files to /dist
npm run preview # sanity-check the production build locally
```

## Environment variables

**Backend (`backend/.env`)**

| Variable | Description | Example |
|---|---|---|
| `PORT` | API server port | `5000` |
| `NODE_ENV` | `development` or `production` | `development` |
| `MONGO_URI` | MongoDB connection string | `mongodb://127.0.0.1:27017/loopr_dashboard` |
| `JWT_SECRET` | Secret used to sign JWTs — use a long random string | `a1b2c3...` |
| `JWT_EXPIRES_IN` | Token lifetime | `1d` |
| `CLIENT_ORIGIN` | Allowed CORS origin(s), comma-separated | `http://localhost:5173` |
| `SEED_ADMIN_EMAIL` | Email for the seeded demo account | `admin@loopr.dev` |
| `SEED_ADMIN_PASSWORD` | Password for the seeded demo account | `Admin@12345` |

**Frontend (`frontend/.env`)**

| Variable | Description | Example |
|---|---|---|
| `VITE_API_BASE_URL` | Base URL of the backend API | `http://localhost:5000/api` |

## Seeding the database

The sample dataset (`transactions.json`, 300 records) is bundled in `backend/src/seed/`. Running `npm run seed`:
1. Connects to the configured MongoDB instance
2. Clears any existing `transactions` collection (safe for repeated runs during development)
3. Bulk-inserts all 300 records
4. Creates the demo admin user if it doesn't already exist

## API documentation

Full endpoint reference (request/response shapes, query params, status codes) is in [`docs/API.md`](docs/API.md).

Quick overview:

| Method | Endpoint | Auth | Purpose |
|---|---|---|---|
| POST | `/api/auth/register` | Public | Create a new user |
| POST | `/api/auth/login` | Public | Log in, receive JWT |
| GET | `/api/auth/me` | Private | Get current user profile |
| GET | `/api/transactions` | Private | Paginated/filtered/sorted transaction list |
| GET | `/api/transactions/filters` | Private | Distinct values for filter dropdowns |
| GET | `/api/transactions/summary` | Private | KPIs + chart data (respects filters) |
| GET | `/api/export/columns` | Private | Available export columns |
| POST | `/api/export/csv` | Private | Generate & download a configured CSV |

## Postman collection

Import [`postman/Loopr-Dashboard.postman_collection.json`](postman/Loopr-Dashboard.postman_collection.json) into Postman. It includes:
- A `{{baseUrl}}` variable (defaults to `http://localhost:5000/api`)
- A login request that **automatically saves the returned JWT** into a `{{token}}` collection variable via a test script, so every subsequent request is pre-authenticated
- One request per endpoint, with example bodies/params

## Deployment guide

You'll need three things to submit: a **GitHub repo**, a **Postman collection link**, and (optionally) a **live deployed link**. Suggested free-tier path:

### Backend → Render
1. Push this repo to GitHub.
2. On [Render](https://render.com), create a **New Web Service**, connect your repo, set the root directory to `backend`.
3. Build command: `npm install && npm run build` · Start command: `npm start`.
4. Add environment variables from the table above (use a MongoDB Atlas `MONGO_URI` — Render doesn't host MongoDB itself).
5. After creating a user via Atlas and seeding (`npm run seed` locally against the Atlas URI, or via a Render Shell), your API is live at `https://<your-service>.onrender.com/api`.

### Database → MongoDB Atlas
1. Create a free M0 cluster at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas/register).
2. Add a database user and allow access from `0.0.0.0/0` (or Render's IPs) under Network Access.
3. Copy the connection string into `MONGO_URI`.

### Frontend → Vercel or Netlify
1. Import the repo, set the root directory to `frontend`.
2. Build command: `npm run build` · Output directory: `dist`.
3. Add environment variable `VITE_API_BASE_URL` pointing at your deployed backend, e.g. `https://<your-service>.onrender.com/api`.
4. Deploy — you'll get a URL like `https://loopr-dashboard.vercel.app`.

### Postman link
In Postman, click **Share** on the collection → **Via link** → copy the public link to include in your submission.

## Design decisions & trade-offs

- **Server-side everything (filtering/sorting/pagination/search):** more API round-trips than client-side filtering, but it's the only approach that scales past the 300-row sample dataset and is what a real analytics tool would need — a deliberate choice to demonstrate backend querying skill, not just frontend state management.
- **MongoDB aggregation pipeline for `/summary`:** rather than pulling all matching rows to Node and reducing in JS, the KPI/trend/breakdown math happens in the database, which is both faster and more idiomatic Mongo.
- **CSV generation on the backend (`json2csv`):** keeps column formatting (currency, date) consistent regardless of client, and avoids shipping the entire filtered dataset to the browser just to format it there.
- **JWT in `localStorage` (not httpOnly cookie):** simpler to demo/test via Postman and avoids CSRF-token plumbing for an assignment of this scope; a production system handling real financial data would likely move to httpOnly cookies + CSRF protection.
- **Export column whitelist on the backend:** the `EXPORTABLE_COLUMNS` map is the single source of truth for what can be exported, so a malicious or malformed `columns` array is rejected with a clear 400 rather than silently exporting garbage.

## Possible future improvements

- Role-based views (e.g., `analyst` read-only vs `admin` can manage users)
- WebSocket/SSE push for real-time transaction updates instead of polling
- Streamed CSV generation for exports beyond the current 50k-row cap
- Automated tests (Jest/Supertest for the API, React Testing Library for components)
- Dark mode theme toggle
