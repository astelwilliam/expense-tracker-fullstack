import { test, expect } from "@playwright/test";
import PDFDocument from "pdfkit";
import { readFileSync } from "node:fs";

async function validPdf(): Promise<Buffer> {
  return new Promise((resolve, reject) => { const doc = new PDFDocument(); const chunks: Buffer[] = []; doc.on("data", (chunk: Buffer) => chunks.push(chunk)); doc.on("end", () => resolve(Buffer.concat(chunks))); doc.on("error", reject); doc.fontSize(18).text("Synthetic PDF statement page", 40, 40); doc.end(); });
}

async function mockApi(page: import("@playwright/test").Page) {
  await page.route("**/api/categories", async (route) => route.fulfill({ json: [] }));
  await page.route("**/api/transactions", async (route) => route.fulfill({ json: [] }));
  await page.route("**/api/transactions/import/preview", async (route) => route.fulfill({ json: { total: 2, toImport: 2, alreadyImported: 0, transactionIds: { present: 1, missing: 1 }, preview: [{ title: "Salary", amount: 5000, type: "income", transactionDate: "2026-11-11", category: "Salary" }, { title: "Lunch", amount: -250, type: "expense", transactionDate: "2026-11-12", category: "Food" }] } }));
  await page.route("**/api/transactions/import", async (route) => route.fulfill({ status: 201, json: { imported: 2, alreadyImported: 0 } }));
  await page.route("**/api/smart-import/extract", async (route) => route.fulfill({ json: { pageCount: 2, warnings: [], candidates: [{ title: "Zomato", amount: 450, type: "expense", transactionDate: "2026-11-10", category: "Food", confidence: "high", warnings: [], duplicate: { status: "new", reason: "No match" } }] } }));
}

test.beforeEach(async ({ page }) => { await mockApi(page); await page.addInitScript(() => localStorage.setItem("token", "test-token")); });
test("shows a PDF review and updates page navigation", async ({ page }) => {
  await page.goto("/smart-import");
  await page.locator('input[type="file"]').setInputFiles({ name: "statement.pdf", mimeType: "application/pdf", buffer: await validPdf() });
  await page.getByRole("button", { name: "Extract for review" }).click();
  await expect(page.getByText("Page 1 / 2")).toBeVisible();
  await page.getByRole("button", { name: "Next" }).click();
  await expect(page.getByText("Page 2 / 2")).toBeVisible();
  await page.getByRole("button", { name: "Previous" }).click();
  await expect(page.getByText("Page 1 / 2")).toBeVisible();
});
test("keeps the review usable on mobile", async ({ page }) => {
  await page.goto("/smart-import");
  await expect(page.getByRole("button", { name: "Browse files" })).toBeVisible();
  await expect(page.getByText("PDF/images up to 10 MB", { exact: false })).toBeVisible();
});

test("keeps invalid extraction data in manual review without crashing", async ({ page }) => {
  await page.route("**/api/smart-import/extract", (route) => route.fulfill({ json: {
    candidates: [{ title: "Total Balance", confidence: "high", category: "Other" }],
  } }));
  await page.goto("/smart-import");
  await page.locator('input[type="file"]').setInputFiles({ name: "showcase.png", mimeType: "image/png", buffer: Buffer.from("not-read-by-mocked-api") });
  await page.getByRole("button", { name: "Extract for review" }).click();
  await expect(page.getByRole("heading", { name: "Smart Import" })).toBeVisible();
  await expect(page.getByText("Review extracted candidates")).toBeVisible();
  await expect(page.getByLabel("Candidate 1")).not.toBeChecked();
  await expect(page.getByText("Amount was not found.")).toBeVisible();
  await expect(page.getByText("Transaction date was not found.")).toBeVisible();
  await expect(page.getByText("Income or expense could not be determined.")).toBeVisible();
});

test("preserves an extracted reference ID when the user confirms a reviewed row", async ({ page }) => {
  let submitted: unknown;
  await page.route("**/api/smart-import/extract", (route) => route.fulfill({ json: { warnings: [], candidates: [{ title: "Zomato", amount: 450, type: "expense", transactionDate: "2026-11-10", category: "Food", confidence: "high", warnings: [], referenceId: "UPI-ab_123", duplicate: { status: "new", reason: "No match" } }] } }));
  await page.route("**/api/smart-import/confirm", async (route) => { submitted = route.request().postDataJSON(); await route.fulfill({ status: 201, json: { imported: 1 } }); });
  await page.goto("/smart-import");
  await page.locator('input[type="file"]').setInputFiles({ name: "statement.pdf", mimeType: "application/pdf", buffer: await validPdf() });
  await page.getByRole("button", { name: "Extract for review" }).click();
  await page.getByRole("button", { name: "Confirm selected transactions" }).click();
  await expect.poll(() => submitted).toEqual({ candidates: [expect.objectContaining({ referenceId: "UPI-ab_123" })] });
});

test("preserves the uploaded file and edited review while navigating", async ({ page }) => {
  await page.goto("/smart-import");
  await page.locator('input[type="file"]').setInputFiles({ name: "statement.pdf", mimeType: "application/pdf", buffer: await validPdf() });
  await page.getByRole("button", { name: "Extract for review" }).click();
  await page.getByLabel("Title").fill("Edited lunch");
  await page.getByLabel("Candidate 1").uncheck();
  await page.getByRole("link", { name: "Dashboard" }).click();
  await page.getByRole("link", { name: "Smart Import" }).click();
  await expect(page.getByText("statement.pdf")).toBeVisible();
  await expect(page.getByLabel("Title")).toHaveValue("Edited lunch");
  await expect(page.getByLabel("Candidate 1")).not.toBeChecked();
});

test("clears the temporary draft on explicit removal", async ({ page }) => {
  await page.goto("/smart-import");
  await page.locator('input[type="file"]').setInputFiles({ name: "statement.pdf", mimeType: "application/pdf", buffer: await validPdf() });
  await page.getByRole("button", { name: "Remove" }).click();
  await expect(page.getByText("statement.pdf")).not.toBeVisible();
});

test("does not restore a spreadsheet preview after removal", async ({ page }) => {
  await page.route("**/api/transactions/import/preview", async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 150));
    await route.fulfill({ json: { total: 1, toImport: 1, alreadyImported: 0, transactionIds: { present: 0, missing: 1 }, preview: [] } });
  });
  await page.goto("/smart-import");
  await page.locator('input[type="file"]').setInputFiles({ name: "removed.csv", mimeType: "text/csv", buffer: Buffer.from("valid") });
  await page.getByRole("button", { name: "Remove" }).click();
  await page.waitForTimeout(250);
  await expect(page.getByText("removed.csv")).not.toBeVisible();
  await expect(page.getByRole("region", { name: "Spreadsheet import preview" })).not.toBeVisible();
});

for (const spreadsheet of [
  { name: "transactions.csv", mimeType: "text/csv", buffer: Buffer.from("Date,Title,Type,Amount,Category\n2026-11-12,Lunch,Expense,250,Food") },
  { name: "sample-import.xlsx", mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", buffer: readFileSync("../server/test/sample-import.xlsx") },
]) {
  test(`previews a valid ${spreadsheet.name.split(".").pop()?.toUpperCase()} upload`, async ({ page }) => {
    const pageErrors: Error[] = [];
    page.on("pageerror", (error) => pageErrors.push(error));
    await page.goto("/smart-import");
    await page.locator('input[type="file"]').setInputFiles(spreadsheet);
    const preview = page.getByRole("region", { name: "Spreadsheet import preview" });
    await expect(preview.getByText("2", { exact: true })).toHaveCount(2);
    await expect(preview.getByRole("cell", { name: "Salary" }).first()).toBeVisible();
    await expect(preview.getByText("income")).toBeVisible();
    await expect(preview.getByText("+₹5000.00")).toBeVisible();
    await expect(preview.getByText("1 row(s) include Transaction IDs", { exact: false })).toBeVisible();
    expect(pageErrors).toEqual([]);
  });
}

test("shows every validated spreadsheet row in the bounded preview", async ({ page }) => {
  const rows = Array.from({ length: 6 }, (_, index) => ({ title: `Preview row ${index + 1}`, amount: index + 1, transactionDate: `2026-11-${String(index + 1).padStart(2, "0")}`, category: "Salary" }));
  await page.route("**/api/transactions/import/preview", (route) => route.fulfill({ json: { total: 6, toImport: 6, alreadyImported: 0, transactionIds: { present: 0, missing: 6 }, preview: rows } }));
  await page.goto("/smart-import");
  await page.locator('input[type="file"]').setInputFiles({ name: "six.csv", mimeType: "text/csv", buffer: Buffer.from("valid") });
  const preview = page.getByRole("region", { name: "Spreadsheet import preview" });
  await expect(preview.getByRole("row")).toHaveCount(7);
  await expect(preview.getByRole("cell", { name: "Preview row 6" })).toBeVisible();
  await expect(preview.getByText("6 row(s) do not", { exact: false })).toBeVisible();
});

test("shows spreadsheet validation errors and rejects unsupported files", async ({ page }) => {
  await page.route("**/api/transactions/import/preview", (route) => route.fulfill({ status: 400, json: { message: "Missing required column: Type" } }));
  await page.goto("/smart-import");
  await page.locator('input[type="file"]').setInputFiles({ name: "invalid.csv", mimeType: "text/csv", buffer: Buffer.from("Date,Title\n2026-11-12,Lunch") });
  await expect(page.getByText("Missing required column: Type")).toBeVisible();
  await page.locator('input[type="file"]').setInputFiles({ name: "transactions.txt", mimeType: "text/plain", buffer: Buffer.from("bad") });
  await expect(page.getByText("Choose a PDF, JPG, PNG, WebP, CSV, or XLSX file.")).toBeVisible();
});

test("shows duplicate counts and disables an all-duplicate import", async ({ page }) => {
  await page.route("**/api/transactions/import/preview", (route) => route.fulfill({ json: { total: 2, toImport: 0, alreadyImported: 2, transactionIds: { present: 2, missing: 0 }, preview: [] } }));
  await page.goto("/smart-import");
  await page.locator('input[type="file"]').setInputFiles({ name: "duplicates.csv", mimeType: "text/csv", buffer: Buffer.from("valid") });
  const preview = page.getByRole("region", { name: "Spreadsheet import preview" });
  await expect(preview.getByText("Duplicates skipped")).toBeVisible();
  await expect(preview.getByRole("button", { name: "Confirm import (0)" })).toBeDisabled();
});

test("renders a legacy successful preview without transaction ID counts", async ({ page }) => {
  await page.route("**/api/transactions/import/preview", (route) => route.fulfill({ json: { total: 2, toImport: 1, alreadyImported: 1, preview: [{ title: "Lunch", amount: -250, transactionDate: "2026-11-12", category: "Food" }] } }));
  await page.goto("/smart-import");
  await page.locator('input[type="file"]').setInputFiles({ name: "legacy.csv", mimeType: "text/csv", buffer: Buffer.from("valid") });
  await expect(page.getByRole("region", { name: "Spreadsheet import preview" })).toBeVisible();
  await expect(page.getByText("Transaction ID counts were not provided by the server.", { exact: false })).toBeVisible();
  await expect(page.getByText("Duplicates skipped")).toBeVisible();
});

test("preserves a spreadsheet preview while navigating", async ({ page }) => {
  await page.goto("/smart-import");
  await page.locator('input[type="file"]').setInputFiles({ name: "persistent.csv", mimeType: "text/csv", buffer: Buffer.from("valid") });
  await expect(page.getByRole("region", { name: "Spreadsheet import preview" })).toBeVisible();
  await page.getByRole("link", { name: "Dashboard" }).click();
  await page.getByRole("link", { name: "Smart Import" }).click();
  await expect(page.getByRole("heading", { name: "persistent.csv" })).toBeVisible();
  await expect(page.getByRole("region", { name: "Spreadsheet import preview" })).toBeVisible();
});

test("imports once, refreshes transactions, and clears the completed draft", async ({ page }) => {
  let imported = false;
  let importCalls = 0;
  let transactionReads = 0;
  await page.route("**/api/transactions", async (route) => {
    transactionReads++;
    await route.fulfill({ json: imported ? [{ _id: "new-1", title: "Imported salary", amount: 5000, category: "Salary", transactionDate: "2026-11-11", createdAt: "2026-11-11T00:00:00.000Z" }] : [] });
  });
  await page.route("**/api/transactions/import", async (route) => {
    importCalls++;
    imported = true;
    await new Promise((resolve) => setTimeout(resolve, 150));
    await route.fulfill({ status: 201, json: { imported: 2, alreadyImported: 0 } });
  });
  await page.goto("/smart-import");
  await page.locator('input[type="file"]').setInputFiles({ name: "complete.csv", mimeType: "text/csv", buffer: Buffer.from("valid") });
  const confirm = page.getByRole("button", { name: "Confirm import (2)" });
  await expect(confirm).toBeEnabled();
  await confirm.click();
  const importing = page.getByRole("button", { name: "Importing…" });
  await expect(importing).toBeDisabled();
  await expect(page.getByText("Imported 2 transaction(s)")).toBeVisible();
  await expect(page.getByText("complete.csv")).not.toBeVisible();
  expect(importCalls).toBe(1);
  expect(transactionReads).toBeGreaterThanOrEqual(2);
  await page.getByRole("link", { name: "Dashboard" }).click();
  await expect(page.getByText("Imported salary")).toBeVisible();
});
