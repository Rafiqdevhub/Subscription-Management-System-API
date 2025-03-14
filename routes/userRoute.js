import { Router } from "express";
import {
  createUser,
  deleteUser,
  getUser,
  getUsers,
  updateUser,
} from "../controllers/userController.js";
import authorize from "../middlewares/authMiddleware.js";
import {
  validateIdParam,
  validateUserInput,
} from "../middlewares/validationMiddleware.js";

const userRouter = Router();

userRouter.get("/", authorize, getUsers);
userRouter.get("/:id", authorize, validateIdParam, getUser);
userRouter.post("/", validateUserInput, createUser);
userRouter.put(
  "/:id",
  authorize,
  validateIdParam,
  validateUserInput,
  updateUser
);
userRouter.delete("/:id", authorize, validateIdParam, deleteUser);

export default userRouter;
