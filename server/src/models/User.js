import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    email: { type: String, required: true, trim: true, lowercase: true, unique: true, maxlength: 254 },
    password: { type: String, required: true, select: true },
  },
  { timestamps: true },
);

export default mongoose.model("User", userSchema);
