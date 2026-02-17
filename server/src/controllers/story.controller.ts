import fs from "fs";
import path from "path";
import { Response, NextFunction } from "express";
import { AppError } from "../middlewares/error.middleware";
import { AuthRequest } from "../middlewares/auth.middleware";
import { sendSuccess } from "../utils/response.util";
import {
  addAdminStoryPage,
  createAdminStory,
  deleteAdminStory,
  deleteAdminStoryPage,
  getAdminStoryById,
  listAdminStories,
  reorderAdminStoryPages,
  setAdminStoryPublishState,
  updateAdminStoryMetadata,
  updateAdminStoryPage,
} from "../services/story.service";

const getStoryIdFromParams = (params: AuthRequest["params"]): string => {
  const raw = Array.isArray(params.id)
    ? params.id[0]
    : Array.isArray(params.storyId)
      ? params.storyId[0]
      : params.id ?? params.storyId;
  return raw ?? "";
};

const IMAGE_MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
};

const ensureUploadDir = async () => {
  const uploadDir = path.join(process.cwd(), "uploads", "stories");
  await fs.promises.mkdir(uploadDir, { recursive: true });
  return uploadDir;
};

const createUniqueFileName = (extension: string) => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).slice(2, 10);
  return `story-${timestamp}-${random}${extension}`;
};

export const listAdminStoriesController = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const stories = await listAdminStories({
      status: req.query.status as "draft" | "published" | undefined,
      language: req.query.language as "ar" | "en" | "fr" | undefined,
      search: req.query.search as string | undefined,
    });
    sendSuccess(res, stories);
  } catch (error) {
    next(error);
  }
};

export const getAdminStoryByIdController = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const storyId = getStoryIdFromParams(req.params);
    const story = await getAdminStoryById(storyId);
    sendSuccess(res, story);
  } catch (error) {
    next(error);
  }
};

export const createAdminStoryController = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user?.id) {
      throw new AppError("Authentication required", 401);
    }

    const story = await createAdminStory(req.body, req.user.id);
    sendSuccess(res, story, "Story created as draft", 201);
  } catch (error) {
    next(error);
  }
};

export const uploadStoryImageController = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user?.id) {
      throw new AppError("Authentication required", 401);
    }

    const contentType = (req.headers["content-type"] ?? "").split(";")[0].trim().toLowerCase();
    const extension = IMAGE_MIME_TO_EXT[contentType];

    if (!extension) {
      throw new AppError("Unsupported image type. Use JPG, PNG, WEBP, or GIF.", 400);
    }

    const fileBuffer = Buffer.isBuffer(req.body) ? req.body : Buffer.from([]);
    if (!fileBuffer.length) {
      throw new AppError("Image binary payload is required", 400);
    }

    const maxBytes = 8 * 1024 * 1024;
    if (fileBuffer.length > maxBytes) {
      throw new AppError("Image must be 8MB or smaller", 400);
    }

    const uploadDir = await ensureUploadDir();
    const fileName = createUniqueFileName(extension);
    const filePath = path.join(uploadDir, fileName);
    await fs.promises.writeFile(filePath, fileBuffer);

    const imageUrl = `${req.protocol}://${req.get("host")}/uploads/stories/${fileName}`;
    sendSuccess(
      res,
      {
        url: imageUrl,
        filename: fileName,
        size: fileBuffer.length,
      },
      "Image uploaded",
      201
    );
  } catch (error) {
    next(error);
  }
};

export const updateAdminStoryController = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user?.id) {
      throw new AppError("Authentication required", 401);
    }

    const storyId = getStoryIdFromParams(req.params);
    const story = await updateAdminStoryMetadata(storyId, req.body, req.user.id);
    sendSuccess(res, story, "Story metadata updated");
  } catch (error) {
    next(error);
  }
};

export const deleteAdminStoryController = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const storyId = getStoryIdFromParams(req.params);
    const result = await deleteAdminStory(storyId);
    sendSuccess(res, result, "Story deleted");
  } catch (error) {
    next(error);
  }
};

export const addAdminStoryPageController = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user?.id) {
      throw new AppError("Authentication required", 401);
    }

    const storyId = getStoryIdFromParams(req.params);
    const page = await addAdminStoryPage(storyId, req.body, req.user.id);
    sendSuccess(res, page, "Story page added", 201);
  } catch (error) {
    next(error);
  }
};

export const updateAdminStoryPageController = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user?.id) {
      throw new AppError("Authentication required", 401);
    }

    const storyId = getStoryIdFromParams(req.params);
    const pageId = Array.isArray(req.params.pageId) ? req.params.pageId[0] : req.params.pageId;
    const page = await updateAdminStoryPage(storyId, pageId, req.body, req.user.id);
    sendSuccess(res, page, "Story page updated");
  } catch (error) {
    next(error);
  }
};

export const deleteAdminStoryPageController = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user?.id) {
      throw new AppError("Authentication required", 401);
    }

    const storyId = getStoryIdFromParams(req.params);
    const pageId = Array.isArray(req.params.pageId) ? req.params.pageId[0] : req.params.pageId;
    const result = await deleteAdminStoryPage(storyId, pageId, req.user.id);
    sendSuccess(res, result, "Story page deleted");
  } catch (error) {
    next(error);
  }
};

export const reorderAdminStoryPagesController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user?.id) {
      throw new AppError("Authentication required", 401);
    }

    const storyId = getStoryIdFromParams(req.params);
    const pages = await reorderAdminStoryPages(storyId, req.body.pageIds, req.user.id);
    sendSuccess(res, pages, "Story pages reordered");
  } catch (error) {
    next(error);
  }
};

export const publishAdminStoryController = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user?.id) {
      throw new AppError("Authentication required", 401);
    }

    const storyId = getStoryIdFromParams(req.params);
    const story = await setAdminStoryPublishState(storyId, req.body.published, req.user.id);
    sendSuccess(res, story, req.body.published ? "Story published" : "Story unpublished");
  } catch (error) {
    next(error);
  }
};
