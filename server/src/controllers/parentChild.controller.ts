import { Response, NextFunction } from "express";
import { AppError } from "../middlewares/error.middleware";
import { ParentAuthRequest } from "../middlewares/parentAuth.middleware";
import {
  createChildProfile,
  deactivateChildProfile,
  listChildProfiles,
  updateChildProfile,
} from "../services/childProfile.service";
import { sendSuccess } from "../utils/response.util";

export const listChildProfilesController = async (req: ParentAuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.parent?.id) {
      throw new AppError("Parent authentication required", 401);
    }
    const children = await listChildProfiles(req.parent.id);
    sendSuccess(res, children);
  } catch (error) {
    next(error);
  }
};

export const createChildProfileController = async (req: ParentAuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.parent?.id) {
      throw new AppError("Parent authentication required", 401);
    }
    const child = await createChildProfile(req.parent.id, req.body);
    sendSuccess(res, child, "Child profile created", 201);
  } catch (error) {
    next(error);
  }
};

export const updateChildProfileController = async (req: ParentAuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.parent?.id) {
      throw new AppError("Parent authentication required", 401);
    }
    const childProfileId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const child = await updateChildProfile(req.parent.id, childProfileId, req.body);
    sendSuccess(res, child, "Child profile updated");
  } catch (error) {
    next(error);
  }
};

export const deleteChildProfileController = async (req: ParentAuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.parent?.id) {
      throw new AppError("Parent authentication required", 401);
    }
    const childProfileId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const child = await deactivateChildProfile(req.parent.id, childProfileId);
    sendSuccess(res, child, "Child profile deactivated");
  } catch (error) {
    next(error);
  }
};
