import jwt from "jsonwebtoken";
import mongoose from "mongoose";

export default function protect(req, res, next) {
  const header = req.get("authorization") || "";
  const match = /^Bearer\s+(\S+)$/i.exec(header);
  if (!match) return res.status(401).json({ message: "Authentication required" });

  try {
    const payload = jwt.verify(match[1], process.env.JWT_SECRET, {
      algorithms: ["HS256"],
      issuer: "expense-tracker",
      audience: "expense-tracker-client",
    });
    if (typeof payload !== "object" || !mongoose.isValidObjectId(payload.sub)) {
      return res.status(401).json({ message: "Invalid token" });
    }
    req.user = { id: payload.sub };
    return next();
  } catch {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}
