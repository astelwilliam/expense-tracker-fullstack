import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import connectDB from "./config/db.js";

import authRoutes from "./routes/authRoutes.js";
import transactionRoutes from "./routes/transactionRoutes.js";

dotenv.config();

connectDB();

const app = express();

app.use(cors());

app.use(express.json());

app.get("/", (req, res) => {
  res.send("Backend running");
});

app.use("/api/auth", authRoutes);

app.use(
  "/api/transactions",
  transactionRoutes
);

const PORT =
  process.env.PORT || 10000;

app.listen(PORT, () => {
  console.log(
    `Server running on port ${PORT}`
  );
});

