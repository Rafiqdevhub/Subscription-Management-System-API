import { Router } from "express";
import { sendReminders } from "../controllers/workflowController.js";
import authorize from "../middlewares/authMiddleware.js";

const workflowRouter = Router();

// Add authorization to protect workflow endpoints
workflowRouter.post("/subscription/reminder", authorize, sendReminders);

export default workflowRouter;
