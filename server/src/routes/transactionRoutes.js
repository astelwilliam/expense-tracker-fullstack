import express from "express";

import {
  getTransactions,
  addTransaction,
  updateTransaction,
  deleteTransaction,
} from "../controllers/transactionController.js";

import protect from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", protect, getTransactions);

router.post("/", protect, addTransaction);

router.put("/:id", protect, updateTransaction);

router.delete("/:id", protect, deleteTransaction);

export default router;