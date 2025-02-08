import express from "express";
import { PORT } from "./config/env.js";
import authRouter from "./routes/authRoute.js";
import connectDB from "./database/mongodb.js";

const app = express();

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.use("/api/v1/auth", authRouter);

app.listen(PORT, () => {
  connectDB();
  console.log(`Server is running on http://localhost:${PORT}`);
});
