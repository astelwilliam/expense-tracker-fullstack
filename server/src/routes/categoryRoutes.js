import { Router } from "express";
import Category from "../models/Category.js";
import protect from "../middleware/authMiddleware.js";

const router = Router();
router.get("/", protect, async (req, res, next) => { try { res.json(await Category.find({ user: req.user.id }).sort({ name: 1 }).lean()); } catch (error) { next(error); } });
router.post("/", protect, async (req, res, next) => {
  try {
    const name = typeof req.body?.name === "string" ? req.body.name.trim() : "";
    if (!name || name.length > 50 || /[\u0000-\u001f]/.test(name)) return res.status(400).json({ message: "Category must be 1-50 safe characters" });
    const row = await Category.findOneAndUpdate({ user: req.user.id, name }, { $setOnInsert: { user: req.user.id, name } }, { upsert: true, new: true, runValidators: true });
    return res.status(201).json(row);
  } catch (error) { return next(error); }
});
export default router;
