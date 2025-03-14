import { Router } from "express";
import {
  cancelSubscription,
  createSubscription,
  deleteSubscription,
  getSubscription,
  getSubscriptionsById,
  updateSubscriptionById,
} from "../controllers/subscriptionController.js";
import authorize from "../middlewares/authMiddleware.js";

const subscriptionRouter = Router();

subscriptionRouter.get("/", authorize, getSubscription);

subscriptionRouter.post("/", authorize, createSubscription);

subscriptionRouter.put("/:id", authorize, updateSubscriptionById);

subscriptionRouter.delete("/:id", authorize, deleteSubscription);

subscriptionRouter.get("/user/:id", authorize, getSubscriptionsById);

subscriptionRouter.put("/:id/cancel", authorize, cancelSubscription);

subscriptionRouter.get("/upcoming-renewals", authorize, cancelSubscription);

export default subscriptionRouter;
