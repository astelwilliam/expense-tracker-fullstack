import mongoose from "mongoose";
import Transaction from "../models/Transaction.js";
import { validateTransaction } from "../utils/validation.js";

export async function getTransactions(req, res, next) {
  try {
    const rows = await Transaction.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .limit(500);
    return res.json(rows);
  } catch (err) {
    return next(err);
  }
}

export async function addTransaction(req, res, next) {
  const { error, value } = validateTransaction(req.body);
  if (error) return res.status(400).json({ message: error });
  try {
    const row = await Transaction.create({
      ...value,
      transactionDate: value.transactionDate ?? new Date().toISOString().slice(0, 10),
      user: req.user.id,
    });
    return res.status(201).json(row);
  } catch (err) {
    return next(err);
  }
}

export async function updateTransaction(req, res, next) {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ message: "Invalid transaction ID" });
  }
  const { error, value } = validateTransaction(req.body);
  if (error) return res.status(400).json({ message: error });
  try {
    // Ownership is part of the query; never accept `user` from the client.
    const row = await Transaction.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      { $set: value },
      { new: true, runValidators: true },
    );
    if (!row) return res.status(404).json({ message: "Transaction not found" });
    return res.json(row);
  } catch (err) {
    return next(err);
  }
}

export async function deleteTransaction(req, res, next) {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ message: "Invalid transaction ID" });
  }
  try {
    const row = await Transaction.findOneAndDelete({
      _id: req.params.id,
      user: req.user.id,
    });
    if (!row) return res.status(404).json({ message: "Transaction not found" });
    return res.status(204).end();
  } catch (err) {
    return next(err);
  }
}
