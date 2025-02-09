import { Router } from "express";
import { sendReminders } from "../controllers/workflowController.js";

const workflowRouter = Router();

workflowRouter.post("/subscription/reminder", sendReminders);

export default workflowRouter;
