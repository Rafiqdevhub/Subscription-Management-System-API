import { SERVER_URL } from "../config/env.js";
import workflowClient from "../config/upstash.js";
import Subscription from "../models/subscriptionModel.js";

const createSubscription = async (req, res, next) => {
  try {
    const subscription = await Subscription.create({
      ...req.body,
      user: req.user._id,
    });

    // const { workflowRunId } = await workflowClient.trigger({
    //   url: `${SERVER_URL}/api/v1/workflows/subscription/reminder`,
    //   body: {
    //     subscriptionId: subscription.id,
    //   },
    //   headers: {
    //     "content-type": "application/json",
    //   },
    //   retries: 0,
    // });
    res.status(201).json({ success: true, data: subscription });
  } catch (error) {
    next(error);
  }
};

const getSubscription = async (req, res, next) => {
  try {
    const subscription = await Subscription.find();
    res.status(200).json({ success: true, data: subscription });
  } catch (error) {
    next(error);
  }
};

const getSubscriptionsById = async (req, res, next) => {
  try {
    if (req.user.id !== req.params.id) {
      const error = new Error("You are not the user of this account");
      error.status = 401;
      throw error;
    }
    const subscriptions = await Subscription.find({ user: req.params.id });
    res.status(200).json({ success: true, data: subscriptions });
  } catch (error) {
    next(error);
  }
};

const updateSubscriptionById = async (req, res, next) => {};

const deleteSubscription = async (req, res, next) => {};

const cancelSubscription = async (req, res, next) => {};

const renewalSubscription = async (req, res, next) => {};

export {
  createSubscription,
  getSubscriptionsById,
  getSubscription,
  updateSubscriptionById,
  deleteSubscription,
  cancelSubscription,
  renewalSubscription,
};
