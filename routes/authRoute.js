import { Router } from "express";
import { signIn, signOut, signUp } from "../controllers/authController.js";
import {
  validateLoginInput,
  validateUserInput,
} from "../middlewares/validationMiddleware.js";

const authRouter = Router();

authRouter.post("/sign-up", validateUserInput, signUp);
authRouter.post("/sign-in", validateLoginInput, signIn);
authRouter.post("/sign-out", signOut);

export default authRouter;
