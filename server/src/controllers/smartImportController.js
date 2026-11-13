import { extractDocument } from "../utils/documentExtraction.js";
import Transaction from "../models/Transaction.js";
import { validateTransaction } from "../utils/validation.js";

const normalized = (value) => String(value ?? "").trim().toLowerCase().replace(/\s+/g, " ");
function signed(candidate) { return candidate.type === "income" ? candidate.amount : -candidate.amount; }
export function duplicateStatus(candidate, existing, earlier = []) {
  const reference = normalized(candidate.referenceId);
  const source = [...existing, ...earlier];
  if (reference && source.some((row) => normalized(row.referenceId) === reference)) return { status: "exact", reason: "The same transaction/reference ID already exists in this account or document." };
  const title = normalized(candidate.title);
  const amount = signed(candidate);
  const same = source.find((row) => row.amount === amount && row.transactionDate === candidate.transactionDate && normalized(row.title) === title);
  if (same) return { status: "possible", reason: "Same merchant, signed amount, and date found. Review before importing." };
  return { status: "new", reason: "No matching transaction evidence found." };
}
async function applyDuplicateStatus(candidates, user) {
  const existing = await Transaction.find({ user }).select("title amount transactionDate referenceId").lean();
  const accepted = [];
  return candidates.map((candidate) => {
    const duplicate = duplicateStatus(candidate, existing, accepted);
    if (duplicate.status !== "exact") accepted.push(candidate);
    return { ...candidate, duplicate };
  });
}

export async function extractSmartDocument(req, res, next) {
  try {
    if (!req.file?.buffer) return res.status(400).json({ message: "Select one document to extract" });
    const raw = await extractDocument(req.file.buffer);
    const result = { ...raw, candidates: await applyDuplicateStatus(raw.candidates, req.user.id) };
    return res.set("Cache-Control", "no-store").json(result);
  } catch (error) {
    if (error.code === "LIMIT_FILE_SIZE") return res.status(413).json({ message: "Document must be 10 MB or smaller" });
    if (error.message.includes("timed out")) return res.status(408).json({ message: "Document processing timed out. Try a clearer or smaller file." });
    if (/^(Only PDF|File is empty|Document must|PDF must)/.test(error.message)) return res.status(400).json({ message: error.message });
    return next(error);
  }
}

export async function confirmSmartCandidates(req, res, next) {
  try {
    const { candidates } = req.body ?? {};
    if (!Array.isArray(candidates) || candidates.length < 1 || candidates.length > 50) return res.status(400).json({ message: "Confirm between 1 and 50 reviewed transactions" });
    const rows = candidates.map((candidate, index) => {
      const checked = validateTransaction(candidate);
      if (checked.error) throw Object.assign(new Error(`Candidate ${index + 1}: ${checked.error}`), { status: 400 });
      return { ...checked.value, user: req.user.id };
    });
    const referenceRows = rows.filter((row) => row.referenceId);
    // Read all existing references for this account so legacy mixed-case values remain protected.
    const existing = referenceRows.length ? await Transaction.find({ user: req.user.id, referenceId: { $exists: true } }).select("referenceId").lean() : [];
    if (referenceRows.some((row) => existing.some((current) => normalized(current.referenceId) === normalized(row.referenceId)))) {
      return res.status(409).json({ message: "A selected transaction reference ID already exists; nothing was saved" });
    }
    const seen = new Set();
    for (const row of rows) if (row.referenceId && (seen.has(row.referenceId) || (seen.add(row.referenceId), false))) return res.status(409).json({ message: "The same reference ID appears more than once; nothing was saved" });
    const inserted = await Transaction.insertMany(rows, { ordered: true });
    return res.status(201).json({ imported: inserted.length });
  } catch (error) {
    if (error?.code === 11000) return res.status(409).json({ message: "A selected transaction reference ID already exists; nothing was saved" });
    if (error.status) return res.status(error.status).json({ message: error.message });
    return next(error);
  }
}
