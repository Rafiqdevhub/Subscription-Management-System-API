import express from "express";
import { PORT } from "./config/env.js";
import authRouter from "./routes/authRoute.js";
import connectDB from "./database/mongodb.js";
import userRouter from "./routes/userRoute.js";
import subscriptionRouter from "./routes/subscriptionRoute.js";
import workflowRouter from "./routes/workflowRoute.js";
import errorMiddleware from "./middlewares/errorMiddleware.js";
import cookieParser from "cookie-parser";
import arcjetMiddleware from "./middlewares/arcjetMiddleware.js";
import morgan from "morgan";
import helmet from "helmet";
import winston from "winston";

// Initialize winston logger
const logger = winston.createLogger({
  level: "info",
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: "error.log", level: "error" }),
    new winston.transports.File({ filename: "combined.log" }),
  ],
});

if (process.env.NODE_ENV !== "production") {
  logger.add(
    new winston.transports.Console({
      format: winston.format.simple(),
    })
  );
}

const app = express();

app.use(
  morgan("combined", {
    stream: { write: (message) => logger.info(message.trim()) },
  })
);
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(arcjetMiddleware);

app.use("/api/v1/auth", authRouter);
app.use("/api/v1/users", userRouter);
app.use("/api/v1/subscriptions", subscriptionRouter);
app.use("/api/v1/workflows", workflowRouter);

app.use(errorMiddleware);

app.get("/", (req, res) => {
  res.send("Welcome to the Subscription  API!");
});

app.listen(PORT, async () => {
  logger.info(`Server is running on http://localhost:${PORT}`);
  await connectDB();
});
