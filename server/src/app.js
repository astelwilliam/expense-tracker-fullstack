import express from "express";
import cors from "cors";
import helmet from "helmet";
import mongoose from "mongoose";
import authRoutes from "./routes/authRoutes.js";
import transactionRoutes from "./routes/transactionRoutes.js";
import smartImportRoutes from "./routes/smartImportRoutes.js";
import categoryRoutes from "./routes/categoryRoutes.js";

export function createApp() {
  const app = express();
  if (process.env.NODE_ENV === "production") app.set("trust proxy", 1);
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        baseUri: ["'self'"],
        frameAncestors: ["'none'"],
        objectSrc: ["'self'", "blob:"],
        imgSrc: ["'self'", "blob:", "data:"],
      },
    },
    crossOriginResourcePolicy: false,
  }));
  const allowed = (process.env.CLIENT_ORIGIN || "http://localhost:5173")
    .split(",").map((origin) => origin.trim().replace(/\/$/, "")).filter(Boolean);

  app.use(cors({
    origin(origin, callback) {
      if (!origin || allowed.includes(origin)) return callback(null, true);
      return callback(new Error("Origin not permitted"));
    },
  }));
  app.use(express.json({ limit: "1.5mb" })); // 1 MB file encoded as base64 for spreadsheet imports

  app.get("/", (_req, res) => res.send("Expense Tracker API"));
  app.get("/api/health", (_req, res) => res.status(mongoose.connection.readyState === 1 ? 200 : 503)
    .json({ status: mongoose.connection.readyState === 1 ? "ok" : "database_unavailable" }));
  app.use("/api/auth", authRoutes);
  app.use("/api/transactions", transactionRoutes);
  app.use("/api/smart-import", smartImportRoutes);
  app.use("/api/categories", categoryRoutes);
  app.use((_req, res) => res.status(404).json({ message: "Not found" }));
  app.use((err, _req, res, _next) => {
    // Never expose stack traces, credentials, or MongoDB error details to clients.
    console.error("Request failed:", err.message);
    if (err.message === "Origin not permitted") return res.status(403).json({ message: "Origin not permitted" });
    if (err.type === "entity.too.large") return res.status(413).json({ message: "Request too large" });
    if (err instanceof SyntaxError && "body" in err) return res.status(400).json({ message: "Invalid JSON" });
    return res.status(500).json({ message: "Internal server error" });
  });
  return app;
}
