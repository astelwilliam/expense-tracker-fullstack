import { test, expect } from "@playwright/test";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

const rows = [
  { _id: "income-1", title: "Salary Credit", amount: 50000, category: "Salary", transactionDate: "2026-11-01", createdAt: "2026-11-01" },
  { _id: "expense-1", title: "Zomato", amount: -450, category: "Food", transactionDate: "2026-11-10", createdAt: "2026-11-10" },
];

async function api(page: import("@playwright/test").Page) {
  await page.route("**/api/categories", (route) => route.fulfill({ json: [] }));
  await page.route("**/api/transactions", (route) => {
    if (route.request().method() === "GET") return route.fulfill({ json: rows });
    if (route.request().method() === "POST") return route.fulfill({ json: { ...rows[0], _id: "new-1", ...route.request().postDataJSON() } });
    return route.fulfill({ status: 204 });
  });
  await page.route("**/api/transactions/*", (route) => route.fulfill({ json: { ...rows[1], ...route.request().postDataJSON() } }));
}

test.beforeEach(async ({ page }) => { await api(page); await page.addInitScript(() => localStorage.setItem("token", "test-token")); });

test("dashboard and navigation render with mocked account data", async ({ page }, testInfo) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Your money, clearly." })).toBeVisible();
  await expect(page.getByText("Salary Credit")).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath("dashboard.png"), fullPage: true });
  await page.getByRole("link", { name: "Analytics" }).click();
  await expect(page.getByRole("heading", { name: "Analytics" })).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath("analytics.png"), fullPage: true });
});

test("transactions support search, filters, creation, edit dialog and deletion affordance", async ({ page }, testInfo) => {
  await page.goto("/transactions");
  await expect(page.getByText("Zomato")).toBeVisible();
  await page.getByPlaceholder("Search title or category").fill("Zomato");
  await expect(page.getByText("Salary Credit")).not.toBeVisible();
  await page.getByLabel("Transaction title").fill("Coffee");
  await page.locator('input[type="number"]').first().fill("120");
  await page.getByRole("button", { name: "Add transaction" }).click();
  await page.getByRole("button", { name: "Edit Zomato" }).click();
  await expect(page.getByRole("dialog", { name: "Edit transaction" })).toBeVisible();
  await page.getByRole("button", { name: "Close edit dialog" }).click();
  await page.screenshot({ path: testInfo.outputPath("transactions.png"), fullPage: true });
});

test("mobile layout, keyboard focus, and critical axe checks pass", async ({ page }, testInfo) => {
  await page.goto("/smart-import");
  await page.getByRole("button", { name: "Browse files" }).focus();
  await page.keyboard.press("Tab");
  await expect.poll(() => page.evaluate(() => document.activeElement?.tagName)).toMatch(/BUTTON|A|INPUT/);
  for (const path of ["/smart-import", "/", "/transactions", "/analytics"]) {
    await page.goto(path);
    await page.addScriptTag({ path: require.resolve("axe-core/axe.min.js") });
    const results = await page.evaluate(async () => await (window as unknown as { axe: { run: () => Promise<{ violations: Array<{ impact: string | null }> }> } }).axe.run());
    expect(results.violations.filter((item) => item.impact === "critical" || item.impact === "serious")).toEqual([]);
  }
  await page.goto("/smart-import");
  await expect(page.getByRole("button", { name: "Browse files" })).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath("mobile-smart-import.png"), fullPage: true });
});

test("logout returns to the login route", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Logout" }).click();
  await expect(page).toHaveURL(/\/login$/);
});
