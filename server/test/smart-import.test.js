import test from "node:test";
import assert from "node:assert/strict";
import { createCanvas } from "@napi-rs/canvas";
import PDFDocument from "pdfkit";
import { detectDocumentType, extractCandidates, extractDocument, MAX_DOCUMENT_BYTES } from "../src/utils/documentExtraction.js";
import { duplicateStatus } from "../src/controllers/smartImportController.js";

function pdfFixture(pages, options = {}) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ autoFirstPage: false, ...options }); const chunks = [];
    doc.on("data", (chunk) => chunks.push(chunk)); doc.on("end", () => resolve(Buffer.concat(chunks))); doc.on("error", reject);
    for (const page of pages) { doc.addPage(); if (Buffer.isBuffer(page)) doc.image(page, 40, 40, { width: 500 }); else doc.fontSize(18).text(page, 40, 40); }
    doc.end();
  });
}

test("categorizes synthetic UPI and receipt text, including ambiguous rows", () => {
  const rows = extractCandidates("Paid Rs 450 to Zomato on 10 Nov 2026 UPI Ref 123456789 Salary Credit Rs 35000 on 01/11/2026");
  assert.equal(rows[0].category, "Food"); assert.equal(rows[0].type, "expense"); assert.equal(rows[0].transactionDate, "2026-11-10");
  assert.equal(rows[1].category, "Salary"); assert.equal(rows[1].type, "income");
  assert.equal(extractCandidates("Receipt total Rs 125")[0].confidence, "medium");
  const uiSummary = extractCandidates("Total Balance Rs 49,550 Income Rs 50,000 Expenses Rs 450 10/11/2026");
  assert.ok(uiSummary.every((row) => row.confidence !== "high"));
  assert.ok(uiSummary.some((row) => row.warnings.includes("No clear transaction wording was found; review this candidate manually.")));
});

test("locally OCRs a synthetic UPI screenshot and rejects invalid files", async () => {
  const canvas = createCanvas(1200, 180); const ctx = canvas.getContext("2d");
  ctx.fillStyle = "white"; ctx.fillRect(0, 0, 1200, 180); ctx.fillStyle = "black"; ctx.font = "42px Arial";
  ctx.fillText("Paid Rs 450 to Zomato on 10 Nov 2026", 20, 90);
  const output = await extractDocument(canvas.toBuffer("image/png"));
  assert.equal(output.fileType, "png"); assert.equal(output.candidates[0].amount, 450); assert.equal(output.candidates[0].category, "Food");
  assert.throws(() => detectDocumentType(Buffer.from("not a document")), /Only PDF/);
  await assert.rejects(() => extractDocument(Buffer.alloc(MAX_DOCUMENT_BYTES + 1)), /10 MB/);
});

test("extracts selectable text and handles synthetic multi-page scanned PDFs", async () => {
  const textPdf = await pdfFixture(["Paid Rs 1299 to Amazon on 10 Nov 2026 Invoice 123456"]);
  const textResult = await extractDocument(textPdf);
  assert.equal(textResult.pageCount, 1); assert.equal(textResult.candidates[0].amount, 1299); assert.equal(textResult.candidates[0].category, "Shopping");
  const canvas = createCanvas(900, 150); const ctx = canvas.getContext("2d"); ctx.fillStyle = "white"; ctx.fillRect(0, 0, 900, 150); ctx.fillStyle = "black"; ctx.font = "32px Arial"; ctx.fillText("Paid Rs 450 to Zomato on 10 Nov 2026", 20, 70);
  const scanned = await extractDocument(await pdfFixture([canvas.toBuffer("image/png"), canvas.toBuffer("image/png")]));
  assert.equal(scanned.pageCount, 2); assert.ok(scanned.candidates.some((row) => row.amount === 450 && row.title === "Zomato" && row.transactionDate === "2026-11-10" && row.category === "Food"));
});

test("rejects a synthetic encrypted PDF without creating candidates", async () => {
  const encrypted = await pdfFixture(["Paid Rs 450 to Zomato on 10 Nov 2026"], { userPassword: "fixture-password", ownerPassword: "owner-password" });
  await assert.rejects(() => extractDocument(encrypted), /Encrypted PDFs are not supported/);
});

test("classifies exact, possible, and legitimate recurring transactions", () => {
  const existing = [{ title: "Zomato", amount: -450, transactionDate: "2026-11-10", referenceId: "UPI123456" }];
  assert.equal(duplicateStatus({ title: "Zomato", amount: 450, type: "expense", transactionDate: "2026-11-10", referenceId: "UPI123456" }, existing).status, "exact");
  assert.equal(duplicateStatus({ title: "Zomato", amount: 450, type: "expense", transactionDate: "2026-11-10" }, existing).status, "possible");
  assert.equal(duplicateStatus({ title: "Zomato", amount: 450, type: "expense", transactionDate: "2026-12-10" }, existing).status, "new");
});
