import { Types } from "mongoose";
import { AppError } from "../middlewares/error.middleware";

/**
 * Validates if a string is a valid MongoDB ObjectId
 */
export const isValidObjectId = (id: string): boolean => {
  return Types.ObjectId.isValid(id);
};

/**
 * Validates and returns a MongoDB ObjectId or throws an error
 */
export const validateObjectId = (id: string, fieldName: string = "ID"): string => {
  if (!id) {
    throw new AppError(`${fieldName} is required`, 400);
  }

  if (!isValidObjectId(id)) {
    throw new AppError(`Invalid ${fieldName} format`, 400);
  }

  return id;
};

/**
 * Validates age range
 */
export const validateAgeRange = (minAge: number, maxAge: number): void => {
  if (minAge < 0 || minAge > 18) {
    throw new AppError("minAge must be between 0 and 18", 400);
  }

  if (maxAge < 0 || maxAge > 18) {
    throw new AppError("maxAge must be between 0 and 18", 400);
  }

  if (minAge > maxAge) {
    throw new AppError("minAge cannot be greater than maxAge", 400);
  }
};

/**
 * Sanitizes string input
 */
export const sanitizeString = (input: string): string => {
  return input.trim().replace(/\s+/g, " ");
};
