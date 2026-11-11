import { Router } from "express";
import multer from "multer";
import protect from "../middleware/authMiddleware.js";
import { MAX_DOCUMENT_BYTES } from "../utils/documentExtraction.js";
import { confirmSmartCandidates, extractSmartDocument } from "../controllers/smartImportController.js";

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: MAX_DOCUMENT_BYTES, files: 1, fields: 0, parts: 2 }, fileFilter: (_req, file, callback) => callback(null, Boolean(file.originalname)) });
const router = Router();
router.post("/extract", protect, upload.single("document"), extractSmartDocument);
router.post("/confirm", protect, confirmSmartCandidates);
export default router;
