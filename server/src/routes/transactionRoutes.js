import express from "express";

import {
  getTransactions,
  addTransaction,
  updateTransaction,
  deleteTransaction,
} from "../controllers/transactionController.js";

import protect from "../middleware/authMiddleware.js";
import { exportTemplate, exportTransactions, previewImport, commitImport } from "../controllers/transferController.js";

const router = express.Router();

router.get("/", protect, getTransactions);
router.get("/export", protect, exportTransactions);
router.get("/template", protect, exportTemplate);
router.post("/import/preview", protect, previewImport);
router.post("/import", protect, commitImport);

router.post("/", protect, addTransaction);

router.put("/:id", protect, updateTransaction);

router.delete("/:id", protect, deleteTransaction);

export default router;