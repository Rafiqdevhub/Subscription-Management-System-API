import { Router } from "express";
import {
  cancelSubscription,
  createSubscription,
  deleteSubscription,
  getSubscription,
  getSubscriptionsById,
  updateSubscriptionById,
  renewalSubscription,
} from "../controllers/subscriptionController.js";
import authorize from "../middlewares/authMiddleware.js";
import {
  validateIdParam,
  validateSubscriptionInput,
} from "../middlewares/validationMiddleware.js";

const subscriptionRouter = Router();

subscriptionRouter.get("/", authorize, getSubscription);
subscriptionRouter.post(
  "/",
  authorize,
  validateSubscriptionInput,
  createSubscription
);
subscriptionRouter.put(
  "/:id",
  authorize,
  validateIdParam,
  validateSubscriptionInput,
  updateSubscriptionById
);
subscriptionRouter.delete(
  "/:id",
  authorize,
  validateIdParam,
  deleteSubscription
);
subscriptionRouter.get(
  "/user/:id",
  authorize,
  validateIdParam,
  getSubscriptionsById
);
subscriptionRouter.put(
  "/:id/cancel",
  authorize,
  validateIdParam,
  cancelSubscription
);
subscriptionRouter.put(
  "/:id/renew",
  authorize,
  validateIdParam,
  renewalSubscription
);

export default subscriptionRouter;
