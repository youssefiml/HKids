import fs from "fs";
import path from "path";
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

const IMAGE_MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
};

const ensureChildUploadDir = async () => {
  const uploadDir = path.join(process.cwd(), "uploads", "children");
  await fs.promises.mkdir(uploadDir, { recursive: true });
  return uploadDir;
};

const createChildAvatarFileName = (childId: string, extension: string) => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).slice(2, 10);
  return `child-${childId}-${timestamp}-${random}${extension}`;
};

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

export const uploadChildAvatarController = async (req: ParentAuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.parent?.id) {
      throw new AppError("Parent authentication required", 401);
    }

    const childProfileId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

    const contentType = (req.headers["content-type"] ?? "").split(";")[0].trim().toLowerCase();
    const extension = IMAGE_MIME_TO_EXT[contentType];

    if (!extension) {
      throw new AppError("Unsupported image type. Use JPG, PNG, WEBP, or GIF.", 400);
    }

    const fileBuffer = Buffer.isBuffer(req.body) ? req.body : Buffer.from([]);
    if (!fileBuffer.length) {
      throw new AppError("Image binary payload is required", 400);
    }

    const maxBytes = 6 * 1024 * 1024;
    if (fileBuffer.length > maxBytes) {
      throw new AppError("Image must be 6MB or smaller", 400);
    }

    const uploadDir = await ensureChildUploadDir();
    const fileName = createChildAvatarFileName(childProfileId, extension);
    const filePath = path.join(uploadDir, fileName);
    await fs.promises.writeFile(filePath, fileBuffer);

    const avatarImageUrl = `${req.protocol}://${req.get("host")}/uploads/children/${fileName}`;
    const child = await updateChildProfile(req.parent.id, childProfileId, { avatarImageUrl });

    sendSuccess(res, child, "Child avatar uploaded", 201);
  } catch (error) {
    next(error);
  }
};
