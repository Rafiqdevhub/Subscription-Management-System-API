import express from "express";
import { PORT } from "./config/env.js";
import authRouter from "./routes/authRoute.js";
import connectDB from "./database/mongodb.js";
import userRouter from "./routes/userRoute.js";
import subscriptionRouter from "./routes/subscriptionRoute.js";
import workflowRouter from "./routes/workflowRoute.js";
import errorMiddleware from "./middlewares/errorMiddleware.js";
import cookieParser from "cookie-parser";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.use("/api/v1/auth", authRouter);
app.use("/api/v1/users", userRouter);
app.use("/api/v1/subscriptions", subscriptionRouter);
app.use("/api/v1/workflows", workflowRouter);

app.use(errorMiddleware);

app.listen(PORT, () => {
  connectDB();
  console.log(`Server is running on http://localhost:${PORT}`);
});
