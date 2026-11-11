import "dotenv/config";
import { createApp } from "./app.js";
import connectDB from "./config/db.js";

async function main() {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    throw new Error("JWT_SECRET must be set to at least 32 characters");
  }
  if (process.env.NODE_ENV === "production" && !process.env.CLIENT_ORIGIN) {
    throw new Error("CLIENT_ORIGIN is required in production");
  }
  await connectDB();
  const port = process.env.PORT || 10000;
  createApp().listen(port, () => console.log(`Server listening on port ${port}`));
}
main().catch((err) => {
  console.error("Startup failed:", err.message);
  process.exit(1);
});
