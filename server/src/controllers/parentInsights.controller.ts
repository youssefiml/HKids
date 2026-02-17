import { Response, NextFunction } from "express";
import { AppError } from "../middlewares/error.middleware";
import { ParentAuthRequest } from "../middlewares/parentAuth.middleware";
import { sendSuccess } from "../utils/response.util";
import { getParentWeeklyDigest } from "../services/parentInsights.service";

export const getParentWeeklyDigestController = async (
  req: ParentAuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.parent?.id) {
      throw new AppError("Parent authentication required", 401);
    }

    const childProfileId =
      typeof req.query.childProfileId === "string" ? req.query.childProfileId : undefined;

    const digest = await getParentWeeklyDigest(req.parent.id, childProfileId);
    sendSuccess(res, digest, "Parent weekly digest");
  } catch (error) {
    next(error);
  }
};
