import { Router } from "express";
import { signupUser, loginUser } from "../controllers/authController.js";
import authRateLimit from "../middleware/authRateLimit.js";

const router = Router();
router.post("/login", authRateLimit, loginUser);
router.post("/signup", authRateLimit, signupUser);
export default router;
