const express = require("express");

const mongoose = require("mongoose");

const cors = require("cors");

const dotenv = require("dotenv");

dotenv.config();

const authRoutes = require(
  "./routes/authRoutes"
);

const transactionRoutes = require(
  "./routes/transactionRoutes"
);

const app = express();

/* MIDDLEWARE */

app.use(
  cors({
    origin: "*",
  })
);

app.use(express.json());

/* ROUTES */

app.use(
  "/api/auth",
  authRoutes
);

app.use(
  "/api/transactions",
  transactionRoutes
);

/* TEST ROUTE */

app.get("/", (req, res) => {
  res.send(
    "Expense Tracker API Running..."
  );
});

/* DATABASE CONNECTION */

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log(
      "MongoDB Connected"
    );
  })
  .catch((error) => {
    console.log(error);
  });

/* SERVER */

const PORT =
  process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(
    `Server running on port ${PORT}`
  );
});