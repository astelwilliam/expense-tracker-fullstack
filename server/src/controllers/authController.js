import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { validateSignup, validateLogin } from "../utils/validation.js";

function createToken(user) {
  return jwt.sign(
    { sub: user._id.toString() },
    process.env.JWT_SECRET,
    { algorithm: "HS256", expiresIn: "7d", issuer: "expense-tracker", audience: "expense-tracker-client" },
  );
}

function publicUser(user) {
  return { id: user._id.toString(), name: user.name, email: user.email };
}

export async function signupUser(req, res, next) {
  const { value, error } = validateSignup(req.body);
  if (error) return res.status(400).json({ message: error });
  try {
    const existing = await User.exists({ email: value.email });
    if (existing) return res.status(409).json({ message: "Email already registered" });

    const hashedPassword = await bcrypt.hash(value.password, 12);
    const user = await User.create({
      name: value.name,
      email: value.email,
      password: hashedPassword,
    });
    return res.status(201).json({ token: createToken(user), user: publicUser(user) });
  } catch (err) {
    // Unique index protects against concurrent duplicate signup requests.
    if (err.code === 11000) return res.status(409).json({ message: "Email already registered" });
    return next(err);
  }
}

export async function loginUser(req, res, next) {
  const { value, error } = validateLogin(req.body);
  if (error) return res.status(400).json({ message: error });
  try {
    const user = await User.findOne({ email: value.email });
    if (!user || !(await bcrypt.compare(value.password, user.password))) {
      return res.status(401).json({ message: "Invalid email or password" });
    }
    return res.json({ token: createToken(user), user: publicUser(user) });
  } catch (err) {
    return next(err);
  }
}
