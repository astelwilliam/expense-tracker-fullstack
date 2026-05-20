import express from "express";

import {
  signupUser,
  loginUser,
} from "../controllers/authController.js";

const router = express.Router();

router.post(
  "/login",
  loginUser
);

router.post(
  "/signup",
  signupUser
);

export default router;