import express, { Router } from "express";
import { protect, requireAdmin } from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";
import {
  storyMetadataSchema,
  storyMetadataUpdateSchema,
  storyPageCreateSchema,
  storyPageUpdateSchema,
  storyPagesReorderSchema,
  storyPublishSchema,
} from "../utils/story.validation";
import {
  addAdminStoryPageController,
  createAdminStoryController,
  deleteAdminStoryController,
  deleteAdminStoryPageController,
  getAdminStoryByIdController,
  listAdminStoriesController,
  publishAdminStoryController,
  reorderAdminStoryPagesController,
  uploadStoryImageController,
  updateAdminStoryController,
  updateAdminStoryPageController,
} from "../controllers/story.controller";

const router = Router();

// All /api/admin routes require an authenticated admin token.
router.use(protect, requireAdmin);

// Story routes: admin only
router.get("/stories", listAdminStoriesController);
router.get("/stories/:id", getAdminStoryByIdController);
router.post(
  "/stories/upload-image",
  express.raw({ type: "image/*", limit: "8mb" }),
  uploadStoryImageController
);
router.post("/stories", validate(storyMetadataSchema), createAdminStoryController);
router.patch("/stories/:id", validate(storyMetadataUpdateSchema), updateAdminStoryController);
router.delete("/stories/:id", deleteAdminStoryController);
router.post(
  "/stories/:id/pages",
  validate(storyPageCreateSchema),
  addAdminStoryPageController
);
router.patch(
  "/stories/:id/pages/:pageId",
  validate(storyPageUpdateSchema),
  updateAdminStoryPageController
);
router.delete("/stories/:id/pages/:pageId", deleteAdminStoryPageController);
router.post(
  "/stories/:id/pages/reorder",
  validate(storyPagesReorderSchema),
  reorderAdminStoryPagesController
);
router.patch(
  "/stories/:id/pages/reorder",
  validate(storyPagesReorderSchema),
  reorderAdminStoryPagesController
);
router.post(
  "/stories/:id/publish",
  validate(storyPublishSchema),
  publishAdminStoryController
);
router.patch(
  "/stories/:id/publish",
  validate(storyPublishSchema),
  publishAdminStoryController
);

export default router;
