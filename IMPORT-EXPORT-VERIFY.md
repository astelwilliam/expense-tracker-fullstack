# Expense Tracker — Excel/CSV Import & Export (V1.2 candidate)

The Transactions page now includes **Download Excel (.xlsx)**, **Download CSV**, **Upload Excel / CSV**, and **Download sample template**.

## Spreadsheet format

Columns: `Transaction ID` (optional), `Date`, `Title`, `Type`, `Amount`, `Category`.

- Dates use `YYYY-MM-DD` (example: `2026-11-10`). Excel numeric date cells are supported.
- `Type`: `Income` or `Expense` (case-insensitive).
- Enter a **positive** amount for either type (example: `250.50`). The backend stores expenses as negative numbers to preserve the existing dashboard.
- `Category`: `Food`, `Salary`, `Shopping`, `Bills`, `Travel`, `Entertainment`, or `Other`.
- For new rows, leave `Transaction ID` empty. Downloaded files include IDs so importing your own file again **skips existing records owned by your account**. Existing records are never overwritten.
- If a file has no IDs, importing it a second time **can create duplicate transactions**. Review the preview and confirm once.
- Only `.csv` and `.xlsx` are supported, not legacy `.xls` or bank statement PDFs.

## Safety limits

- Maximum **1 MB** and **200 data rows** per upload.
- A malformed file or any invalid row rejects the **entire file before writing**.
- Import requires login and adds records only to your account.
- Exports are account-scoped and include up to 5,000 records. They export **all records**, not just the current on-screen filters.
- Uploaded files are parsed in memory (not stored as files on the server). Formula execution is disabled/rejected; exported text that resembles a spreadsheet formula is escaped.

## Setup and local checks (PowerShell)

Extract this ZIP to a **new folder** (do not overwrite your tested V1.1 working copy). Never copy `.env` into GitHub.

Server terminal:

```powershell
cd server
Copy-Item .env.example .env  # only if .env is missing
# Edit server/.env to use your ROTATED Atlas MONGO_URI, JWT_SECRET, CLIENT_ORIGIN=http://localhost:5173
npm ci
npm test
npm audit --omit=dev
# If Windows SRV DNS still fails, use the previously working temporary DNS workaround:
node -e "require('node:dns/promises').setServers(['8.8.8.8', '1.1.1.1']); import('./src/server.js')"
```

Client terminal:

```powershell
cd client
Copy-Item .env.example .env.local  # only if missing
npm ci
npm run lint
npm run build
npm run dev
```

Check http://localhost:10000/api/health and http://localhost:5173/transactions.

## Browser verification checklist

1. Log into **test user A**. Create one income and one expense. Check balance and date totals.
2. Click **Download Excel**, open `.xlsx` in Excel, check dates/amounts and columns.
3. Click **Download CSV**, open in Excel, check values.
4. Click **Upload Excel / CSV**, select the downloaded Excel file. Preview should show **0 new** and existing IDs skipped. Confirm button is disabled.
5. Download the sample CSV. Change title, type, date and amount, leave Transaction ID empty. Upload and inspect preview; click **Confirm import**. Verify balances and analytics.
6. Refresh, log out/in, restart server. Verify the imported row persists.
7. Try an invalid row (zero amount, invalid category, future date like 2026-02-30); verify error and no partial imports.
8. Log into **test user B**. Export should contain only B's data. Import an A-exported file into B: records should belong to B and must not alter A's records.
9. Edit/delete an imported row; verify user A and B remain isolated.

### Deployment

This is a **candidate**, not a verified release. Live MongoDB persistence, browser workflows, frontend lint/build on your Windows machine and real-database isolation must be verified before deployment. Rotate any previously exposed credentials. Do not run `npm audit fix --force` blindly.
