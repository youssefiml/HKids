import { Category } from "../modules/categories/category.model";
import { AppError } from "../middlewares/error.middleware";
import { validateObjectId, validateAgeRange } from "../utils/validators.util";

export const getCategories = async () => {
  return await Category.find({ status: "active" }).sort({ order: 1, name: 1 });
};

export const getCategoryById = async (id: string) => {
  validateObjectId(id, "Category ID");
  
  const category = await Category.findById(id);
  if (!category) {
    throw new AppError("Category not found", 404);
  }
  return category;
};

export const createCategory = async (categoryData: any) => {
  // Validate age range if both are provided
  if (categoryData.minAge !== undefined && categoryData.maxAge !== undefined) {
    validateAgeRange(categoryData.minAge, categoryData.maxAge);
  }

  return await Category.create(categoryData);
};

export const updateCategory = async (id: string, categoryData: any) => {
  validateObjectId(id, "Category ID");

  // Validate age range if both are being updated
  if (categoryData.minAge !== undefined && categoryData.maxAge !== undefined) {
    validateAgeRange(categoryData.minAge, categoryData.maxAge);
  }

  const category = await Category.findByIdAndUpdate(id, categoryData, { new: true, runValidators: true });
  if (!category) {
    throw new AppError("Category not found", 404);
  }
  return category;
};

export const deleteCategory = async (id: string) => {
  validateObjectId(id, "Category ID");
  
  const category = await Category.findByIdAndDelete(id);
  if (!category) {
    throw new AppError("Category not found", 404);
  }
  return category;
};
