import { PDFParse } from "pdf-parse";
import { createWorker } from "tesseract.js";
import eng from "@tesseract.js-data/eng";

export const MAX_DOCUMENT_BYTES = 10 * 1024 * 1024;
export const MAX_PDF_PAGES = 10;
const MAX_OCR_PAGES = 3;
const MAX_TEXT_LENGTH = 50_000;
const categories = ["Food", "Shopping", "Transport", "Entertainment", "Bills", "Utilities", "Education", "Healthcare", "Salary", "Business", "Other"];
const categoryRules = [
  ["Food", /\b(swiggy|zomato|restaurant|cafe|food|grocery)\b/i],
  ["Transport", /\b(uber|ola|metro|railway|fuel|petrol|diesel|taxi)\b/i],
  ["Entertainment", /\b(netflix|spotify|cinema|movie|prime video)\b/i],
  ["Utilities", /\b(electricity|water bill|gas bill|broadband|internet)\b/i],
  ["Healthcare", /\b(pharmacy|hospital|clinic|medical)\b/i],
  ["Education", /\b(school|college|tuition|course|udemy)\b/i],
  ["Salary", /\b(salary|payroll|wages)\b/i],
  ["Shopping", /\b(amazon|flipkart|myntra|store|invoice|shopping)\b/i],
  ["Bills", /\b(recharge|insurance|rent|emi)\b/i],
];

export function detectDocumentType(buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length < 4) throw new Error("File is empty or unreadable");
  if (buffer.subarray(0, 5).toString("ascii") === "%PDF-") return "pdf";
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return "jpeg";
  if (buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "png";
  if (buffer.subarray(0, 4).toString("ascii") === "RIFF" && buffer.subarray(8, 12).toString("ascii") === "WEBP") return "webp";
  throw new Error("Only PDF, JPG, PNG, and WEBP documents are accepted");
}

function cleanText(value) {
  return String(value ?? "").replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, " ").replace(/\s+/g, " ").trim().slice(0, MAX_TEXT_LENGTH);
}
function withTimeout(promise, ms, message) {
  let timer;
  return Promise.race([promise, new Promise((_, reject) => { timer = setTimeout(() => reject(new Error(message)), ms); })]).finally(() => clearTimeout(timer));
}

async function ocrImage(buffer) {
  const worker = await withTimeout(createWorker("eng", 1, { langPath: eng.langPath, gzip: eng.gzip, cacheMethod: "none", logger: () => {} }), 20_000, "OCR initialization timed out");
  try {
    const result = await withTimeout(worker.recognize(buffer), 25_000, "OCR processing timed out");
    return cleanText(result.data.text);
  } finally {
    await worker.terminate().catch(() => {});
  }
}

async function textFromPdf(buffer, warnings) {
  const parser = new PDFParse({ data: buffer });
  try {
    const info = await withTimeout(parser.getInfo({ parsePageInfo: false }), 10_000, "PDF inspection timed out");
    if (!Number.isInteger(info.total) || info.total < 1 || info.total > MAX_PDF_PAGES) throw new Error(`PDF must have between 1 and ${MAX_PDF_PAGES} pages`);
    const text = cleanText((await withTimeout(parser.getText(), 15_000, "PDF text extraction timed out")).text);
    const imageResult = await withTimeout(parser.getImage({ first: 1, last: Math.min(info.total, MAX_OCR_PAGES), imageThreshold: 0, imageDataUrl: false }), 25_000, "PDF image extraction timed out");
    const images = imageResult.pages.flatMap((page) => page.images.map((image) => image.data));
    if (text.length >= 20 && !images.length) return { text, pageCount: info.total };
    warnings.push(images.length ? "OCR was applied to embedded scanned-page images." : "No selectable PDF text was found; OCR was used on up to three pages.");
    const pages = images.length ? await Promise.all(images.map((image) => ocrImage(image))) : [];
    if (!pages.length) {
      const screenshots = await withTimeout(parser.getScreenshot({ first: 1, last: Math.min(info.total, MAX_OCR_PAGES), desiredWidth: 1500, imageDataUrl: false }), 25_000, "PDF rendering timed out");
      pages.push(...await Promise.all(screenshots.pages.map((page) => ocrImage(page.data))));
    }
    if (info.total > MAX_OCR_PAGES) warnings.push(`Only the first ${MAX_OCR_PAGES} scanned pages were processed.`);
    return { text: cleanText([text, ...pages].join("\n")), pageCount: info.total };
  } catch (error) {
    if (/password|encrypted/i.test(error?.message ?? "")) throw new Error("Encrypted PDFs are not supported. Remove the password and try again.");
    throw error;
  } finally {
    await parser.destroy().catch(() => {});
  }
}

function amountFrom(text) {
  const match = text.match(/(?:₹|\bINR\b|\bRs\.?\b)\s*([0-9][0-9,]*(?:\.\d{1,2})?)/i) ?? text.match(/\b(?:total|amount)\s*[:\-]?\s*([0-9][0-9,]*(?:\.\d{1,2})?)/i);
  if (!match) return undefined;
  const amount = Number(match[1].replaceAll(",", ""));
  return Number.isFinite(amount) && amount > 0 && amount <= 1_000_000_000 ? Math.round(amount * 100) / 100 : undefined;
}
function dateFrom(text) {
  const numeric = text.match(/\b(\d{1,2})[\/-](\d{1,2})[\/-](20\d{2})\b/);
  if (numeric) {
    const [, day, month, year] = numeric;
    const date = `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
    if (!Number.isNaN(Date.parse(`${date}T00:00:00Z`))) return date;
  }
  const named = text.match(/\b(\d{1,2})\s+(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s*,?\s*(20\d{2})\b/i);
  if (!named) return undefined;
  const parsed = new Date(`${named[1]} ${named[2]} ${named[3]} UTC`);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed.toISOString().slice(0, 10);
}
function merchantFrom(text) {
  const direct = text.match(/\b(?:paid|pay|sent|debited)\s+(?:₹[\d,.]+\s+)?(?:to|at)\s+([A-Za-z][A-Za-z0-9 .&'_-]{1,70})/i);
  if (direct) return cleanText(direct[1]).replace(/\s+(?:on|via|ref(?:erence)?|utr)\b.*$/i, "").trim();
  const known = text.match(/\b(swiggy|zomato|uber|ola|netflix|amazon|flipkart|salary)\b/i);
  return known ? known[1].replace(/^./, (letter) => letter.toUpperCase()) : undefined;
}
function typeFrom(text) {
  if (/\b(salary|credited|credit|received|refund|cashback)\b/i.test(text)) return "income";
  if (/\b(paid|debited|spent|purchase|total|upi)\b/i.test(text)) return "expense";
  return undefined;
}
function referenceFrom(text) { return text.match(/\b(?:utr|upi\s*(?:ref(?:erence)?|id)?|reference\s*(?:no|id)?|txn\s*(?:id|no)?)\s*[:#-]?\s*([A-Za-z0-9-]{6,})/i)?.[1]; }
function categoryFrom(text) {
  const rule = categoryRules.find(([, pattern]) => pattern.test(text));
  return rule ? { category: rule[0], reason: `Matched a ${rule[0].toLowerCase()} merchant or description rule.` } : { category: "Other", reason: "No category rule matched the extracted text." };
}

export function extractCandidates(text) {
  const source = cleanText(text);
  const parts = source.split(/(?=\b(?:paid|sent|debited|credited|salary|total|amount)\b)/i).filter(Boolean);
  const rows = (parts.length ? parts : [source]).slice(0, 50);
  return rows.map((row) => {
    const amount = amountFrom(row); const transactionDate = dateFrom(row); const title = merchantFrom(row); const type = typeFrom(row); const referenceId = referenceFrom(row);
    const category = categoryFrom(row);
    const warnings = [];
    if (!amount) warnings.push("Amount was not found.");
    if (!type) warnings.push("Income or expense could not be determined.");
    if (!transactionDate) warnings.push("Transaction date was not found.");
    if (!title) warnings.push("Merchant or title was not found.");
    const evidence = [amount, type, transactionDate, title].filter(Boolean).length;
    return { title, amount, type, transactionDate, category: category.category, categoryReason: category.reason, referenceId, description: cleanText(row).slice(0, 300), confidence: evidence === 4 ? "high" : evidence >= 2 ? "medium" : "low", warnings };
  }).filter((candidate) => candidate.amount || candidate.title || candidate.transactionDate);
}

export async function extractDocument(buffer) {
  if (buffer.length > MAX_DOCUMENT_BYTES) throw new Error("Document must be 10 MB or smaller");
  const fileType = detectDocumentType(buffer);
  const warnings = [];
  const parsedPdf = fileType === "pdf" ? await textFromPdf(buffer, warnings) : undefined;
  const text = parsedPdf ? parsedPdf.text : await ocrImage(buffer);
  if (!text) warnings.push("No readable text was found in this document.");
  const candidates = extractCandidates(text);
  if (!candidates.length) warnings.push("No transaction candidates were found. Nothing was saved.");
  return { fileType, candidates, warnings, pageCount: parsedPdf?.pageCount, supportedCategories: categories };
}
