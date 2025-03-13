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

const updateSubscriptionById = async (req, res, next) => {
  try {
    const subscription = await Subscription.findById(req.params.id);

    if (!subscription) {
      const error = new Error("Subscription not found");
      error.statusCode = 404;
      throw error;
    }

    if (subscription.user.toString() !== req.user._id.toString()) {
      const error = new Error(
        "You are not authorized to update this subscription"
      );
      error.statusCode = 403;
      throw error;
    }

    const updatedSubscription = await Subscription.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      data: updatedSubscription,
    });
  } catch (error) {
    next(error);
  }
};

const deleteSubscription = async (req, res, next) => {
  try {
    const subscription = await Subscription.findById(req.params.id);

    if (!subscription) {
      const error = new Error("Subscription not found");
      error.statusCode = 404;
      throw error;
    }

    if (subscription.user.toString() !== req.user._id.toString()) {
      const error = new Error(
        "You are not authorized to delete this subscription"
      );
      error.statusCode = 403;
      throw error;
    }

    await Subscription.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: "Subscription deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

const cancelSubscription = async (req, res, next) => {
  try {
    const subscription = await Subscription.findById(req.params.id);

    if (!subscription) {
      const error = new Error("Subscription not found");
      error.statusCode = 404;
      throw error;
    }

    if (subscription.user.toString() !== req.user._id.toString()) {
      const error = new Error(
        "You are not authorized to cancel this subscription"
      );
      error.statusCode = 403;
      throw error;
    }

    if (subscription.status === "cancelled") {
      const error = new Error("Subscription is already cancelled");
      error.statusCode = 400;
      throw error;
    }

    subscription.status = "cancelled";
    await subscription.save();

    res.status(200).json({
      success: true,
      message: "Subscription cancelled successfully",
      data: subscription,
    });
  } catch (error) {
    next(error);
  }
};

const renewalSubscription = async (req, res, next) => {
  try {
    const subscription = await Subscription.findById(req.params.id);

    if (!subscription) {
      const error = new Error("Subscription not found");
      error.statusCode = 404;
      throw error;
    }

    if (subscription.user.toString() !== req.user._id.toString()) {
      const error = new Error(
        "You are not authorized to renew this subscription"
      );
      error.statusCode = 403;
      throw error;
    }

    if (subscription.status === "active") {
      const error = new Error("Subscription is already active");
      error.statusCode = 400;
      throw error;
    }

    const renewalPeriods = {
      daily: 1,
      weekly: 7,
      monthly: 30,
      yearly: 365,
    };

    const newStartDate = new Date();
    const newRenewalDate = new Date(newStartDate);
    newRenewalDate.setDate(
      newRenewalDate.getDate() + renewalPeriods[subscription.frequency]
    );

    subscription.status = "active";
    subscription.startDate = newStartDate;
    subscription.renewalDate = newRenewalDate;

    await subscription.save();

    const { workflowRunId } = await workflowClient.trigger({
      url: `${SERVER_URL}/api/v1/workflows/subscription/reminder`,
      body: {
        subscriptionId: subscription.id,
      },
      headers: {
        "content-type": "application/json",
      },
      retries: 0,
    });

    res.status(200).json({
      success: true,
      message: "Subscription renewed successfully",
      data: subscription,
    });
  } catch (error) {
    next(error);
  }
};

export {
  createSubscription,
  getSubscriptionsById,
  getSubscription,
  updateSubscriptionById,
  deleteSubscription,
  cancelSubscription,
  renewalSubscription,
};
