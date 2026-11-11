import { test, expect } from "@playwright/test";
import PDFDocument from "pdfkit";

async function validPdf(): Promise<Buffer> {
  return new Promise((resolve, reject) => { const doc = new PDFDocument(); const chunks: Buffer[] = []; doc.on("data", (chunk: Buffer) => chunks.push(chunk)); doc.on("end", () => resolve(Buffer.concat(chunks))); doc.on("error", reject); doc.fontSize(18).text("Synthetic PDF statement page", 40, 40); doc.end(); });
}

async function mockApi(page: import("@playwright/test").Page) {
  await page.route("**/api/categories", async (route) => route.fulfill({ json: [] }));
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
  await expect(page.getByText("PDF, image, CSV, or XLSX")).toBeVisible();
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
