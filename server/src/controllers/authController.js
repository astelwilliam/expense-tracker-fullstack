import jwt from "jsonwebtoken";

export const signupUser = async (
  req,
  res
) => {
  try {
    const { name, email, password } =
      req.body;

    const token = jwt.sign(
      {
        email,
      },
      "secretkey",
      {
        expiresIn: "7d",
      }
    );

    res.json({
      token,
      user: {
        name,
        email,
      },
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      message: "Signup failed",
    });
  }
};

export const loginUser = async (
  req,
  res
) => {
  try {
    const { email } = req.body;

    const token = jwt.sign(
      {
        email,
      },
      "secretkey",
      {
        expiresIn: "7d",
      }
    );

    res.json({
      token,
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      message: "Login failed",
    });
  }
};