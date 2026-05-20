import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export const signupUser = async (
  req,
  res
) => {
  try {
    const {
      name,
      email,
      password,
    } = req.body;

    if (
      !name ||
      !email ||
      !password
    ) {
      return res
        .status(400)
        .json({
          message:
            "All fields are required",
        });
    }

    const hashedPassword =
      await bcrypt.hash(
        password,
        10
      );

    const token = jwt.sign(
      {
        email,
      },
      process.env.JWT_SECRET ||
        "secret123",
      {
        expiresIn: "7d",
      }
    );

    res.status(201).json({
      message:
        "User registered successfully",
      token,
      user: {
        name,
        email,
      },
    });
  } catch (error) {
    res.status(500).json({
      message:
        "Server error",
    });
  }
};

export const loginUser = async (
  req,
  res
) => {
  try {
    const {
      email,
      password,
    } = req.body;

    if (
      !email ||
      !password
    ) {
      return res
        .status(400)
        .json({
          message:
            "All fields are required",
        });
    }

    const token = jwt.sign(
      {
        email,
      },
      process.env.JWT_SECRET ||
        "secret123",
      {
        expiresIn: "7d",
      }
    );

    res.status(200).json({
      message:
        "Login successful",
      token,
      user: {
        email,
      },
    });
  } catch (error) {
    res.status(500).json({
      message:
        "Server error",
    });
  }
};