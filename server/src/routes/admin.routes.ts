import { Router } from "express";
import { protect, requireRole } from "../middlewares/auth.middleware";
import { validate, bookSchema, categorySchema } from "../utils/validation.util";
import {
  getBooksController,
  getBookByIdController,
  createBookController,
  updateBookController,
  publishBookController,
  deleteBookController,
} from "../controllers/book.controller";
import {
  getCategoriesController,
  getCategoryByIdController,
  createCategoryController,
  updateCategoryController,
  deleteCategoryController,
} from "../controllers/category.controller";

const router = Router();

// All admin routes require authentication
router.use(protect);

// Books routes
router.get("/books", requireRole("admin", "editor"), getBooksController);
router.get("/books/:id", requireRole("admin", "editor"), getBookByIdController);
router.post("/books", requireRole("admin", "editor"), validate(bookSchema), createBookController);
router.patch("/books/:id", requireRole("admin", "editor"), validate(bookSchema.partial()), updateBookController);
router.post("/books/:id/publish", requireRole("admin"), publishBookController);
router.delete("/books/:id", requireRole("admin"), deleteBookController);

// Categories routes
router.get("/categories", requireRole("admin", "editor"), getCategoriesController);
router.get("/categories/:id", requireRole("admin", "editor"), getCategoryByIdController);
router.post("/categories", requireRole("admin"), validate(categorySchema), createCategoryController);
router.patch("/categories/:id", requireRole("admin"), validate(categorySchema.partial()), updateCategoryController);
router.delete("/categories/:id", requireRole("admin"), deleteCategoryController);

export default router;
