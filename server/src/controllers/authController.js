export const signupUser = async (
  req,
  res
) => {
  try {
    const { name, email } =
      req.body;

    res.json({
      success: true,
      token: "demo-token",
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
    const { email } =
      req.body;

    res.json({
      success: true,
      token: "demo-token",
      user: {
        email,
      },
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      message: "Login failed",
    });
  }
};