import { Response, NextFunction } from "express";
import { AuthRequest } from "../middlewares/auth.middleware";
import { getCategories, getCategoryById, createCategory, updateCategory, deleteCategory } from "../services/category.service";
import { sendSuccess } from "../utils/response.util";

export const getCategoriesController = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const categories = await getCategories();
    sendSuccess(res, categories);
  } catch (error) {
    next(error);
  }
};

export const getCategoryByIdController = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const category = await getCategoryById(id);
    sendSuccess(res, category);
  } catch (error) {
    next(error);
  }
};

export const createCategoryController = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const category = await createCategory(req.body);
    sendSuccess(res, category, "Category created successfully", 201);
  } catch (error) {
    next(error);
  }
};

export const updateCategoryController = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const category = await updateCategory(id, req.body);
    sendSuccess(res, category, "Category updated successfully");
  } catch (error) {
    next(error);
  }
};

export const deleteCategoryController = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    await deleteCategory(id);
    sendSuccess(res, null, "Category deleted successfully");
  } catch (error) {
    next(error);
  }
};
