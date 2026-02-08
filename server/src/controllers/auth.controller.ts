import { Request, Response, NextFunction } from "express";
import { getMe, login, register } from "../services/auth.service";
import { sendSuccess } from "../utils/response.util";
import { AuthRequest } from "../middlewares/auth.middleware";
import { AppError } from "../middlewares/error.middleware";

export const loginController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;
    const result = await login(email, password);
    sendSuccess(res, result, "Login successful");
  } catch (error) {
    next(error);
  }
};

export const registerController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password, name, role } = req.body;
    const result = await register(email, password, name, role);
    sendSuccess(res, result, "Registration successful", 201);
  } catch (error) {
    next(error);
  }
};

export const meController = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user?.id) {
      throw new AppError("Authentication required", 401);
    }

    const user = await getMe(req.user.id);
    sendSuccess(res, user, "Current user");
  } catch (error) {
    next(error);
  }
};

export const logoutController = async (_req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    sendSuccess(
      res,
      { loggedOut: true },
      "Logged out. For JWT header POC, discard token on the client side."
    );
  } catch (error) {
    next(error);
  }
};
