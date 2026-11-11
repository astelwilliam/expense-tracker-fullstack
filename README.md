# Expense Tracker V2.0

Personal finance application built with React, TypeScript, Vite, Express, and MongoDB. It supports authenticated transaction management, CSV/XLSX transfer, analytics, user-defined categories, and private Smart Import review for PDF and image documents.

## Repository layout

```
client/   React + TypeScript + Vite application
server/   Express + Mongoose API and tests
```

The root `src/` folder is legacy material; deploy the `client/` and `server/` applications only.

## Features

- JWT-authenticated, user-scoped transactions and categories
- Signed amounts: positive income, negative expense
- CSV and Excel preview, import, export, and formula-injection protection
- Smart Import for PDF, JPG/JPEG, PNG, and WEBP with local parsing/OCR
- Review-before-save workflow, extraction warnings, confidence, and duplicate indicators
- Reference-ID validation and per-user duplicate protection
- Responsive dashboard, analytics, transactions, and Smart Import UI

## Requirements

- Node.js 20.19 or newer
- npm
- MongoDB Atlas or local MongoDB for development

## Local setup

Never commit or share `.env`, `.env.test`, or `.env.local` files.

### API

```powershell
cd server
npm ci
Copy-Item .env.example .env
# Set MONGO_URI, JWT_SECRET, and CLIENT_ORIGIN in server/.env.
npm test
npm run dev
```

### Client

```powershell
cd client
npm ci
Copy-Item .env.example .env.local
# Set VITE_API_URL=http://localhost:10000/api in client/.env.local.
npm run lint
npm run build
npm run dev
```

Open `http://localhost:5173`. The API health endpoint is `http://localhost:10000/api/health`.

## Tests

```powershell
# API unit/regression tests
cd server; npm test

# Dedicated staging database only; requires MONGO_TEST_URI in server/.env.test
cd server; npm run test:staging

# Read-only staging reference-ID index readiness check
cd server; npm run check:reference-index

# Client checks
cd client; npm run lint; npm run build; npx playwright test
```

`MONGO_TEST_URI` must target `expense_tracker_test`. Tests must never use the production database.

## Deployment

### Render API

Create a Render Web Service with:

| Setting | Value |
| --- | --- |
| Root directory | `server` |
| Build command | `npm ci` |
| Start command | `npm start` |
| Health check | `/api/health` |

Configure these secrets in Render:

```text
NODE_ENV=production
MONGO_URI=<production Atlas URI>
JWT_SECRET=<new random value, at least 32 characters>
CLIENT_ORIGIN=https://<your-vercel-domain>
```

Render supplies `PORT`; do not set it manually. `CLIENT_ORIGIN` may contain comma-separated exact origins when necessary.

### Vercel client

Create a Vercel project with:

| Setting | Value |
| --- | --- |
| Root directory | `client` |
| Framework | Vite |
| Build command | `npm run build` |
| Output directory | `dist` |

Set this Vercel environment variable:

```text
VITE_API_URL=https://<your-render-service>/api
```

`client/vercel.json` provides the SPA rewrite required for direct page loads.

## Security and release checklist

Before deployment:

1. Rotate any credentials previously stored in local files or shared outside the secret manager.
2. Confirm environment files are not tracked, including Git history.
3. Use a least-privilege Atlas user and restricted network access.
4. Run the duplicate preflight against production only with database-owner approval.
5. Apply the per-user reference-ID unique index only after the preflight is clean and approved.
6. Confirm Render `CLIENT_ORIGIN` exactly matches the Vercel HTTPS origin.
7. Run API tests, staging integration, lint, build, Playwright, and production dependency audits.

The authentication rate limiter is process-local. Use a shared rate-limit store before scaling the Render service horizontally. JWTs are stored in browser local storage; evaluate the XSS trade-off before handling highly sensitive financial data.

## GitHub publishing checklist

- Include source, package manifests/lockfiles, tests, `.env.example` files, `README.md`, and deployment configuration.
- Exclude environment files, `node_modules`, build output, coverage, Playwright reports, and test screenshots.
- Review the staged diff for secrets before the first commit.
- Do not publish until credential rotation and production preflight approvals are complete.

## License

This project is licensed under the [MIT License](LICENSE). Copyright (c) 2026 Astel William.
