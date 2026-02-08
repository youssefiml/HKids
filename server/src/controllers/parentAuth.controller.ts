import { Request, Response, NextFunction } from "express";
import { sendSuccess } from "../utils/response.util";
import { AppError } from "../middlewares/error.middleware";
import { ParentAuthRequest } from "../middlewares/parentAuth.middleware";
import { getParentMe, loginParent, registerParent } from "../services/parentAuth.service";

export const parentRegisterController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;
    const result = await registerParent(email, password);
    sendSuccess(res, result, "Parent account created", 201);
  } catch (error) {
    next(error);
  }
};

export const parentLoginController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;
    const result = await loginParent(email, password);
    sendSuccess(res, result, "Parent login successful");
  } catch (error) {
    next(error);
  }
};

export const parentMeController = async (req: ParentAuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.parent?.id) {
      throw new AppError("Parent authentication required", 401);
    }
    const parent = await getParentMe(req.parent.id);
    sendSuccess(res, parent, "Parent profile");
  } catch (error) {
    next(error);
  }
};

