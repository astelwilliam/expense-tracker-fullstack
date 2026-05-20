import express from "express";

const router = express.Router();

router.post("/login", (req, res) => {
  res.json({
    success: true,
    message: "LOGIN WORKS",
  });
});

router.post("/signup", (req, res) => {
  res.json({
    success: true,
    message: "SIGNUP WORKS",
  });
});

export default router;