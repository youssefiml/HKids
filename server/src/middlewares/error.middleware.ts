import { Request, Response, NextFunction } from "express";

export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Log error for debugging
  if (process.env.NODE_ENV !== "test") {
    console.error("Error:", {
      message: err.message,
      stack: err.stack,
      path: req.path,
      method: req.method,
    });
  }

  // AppError (custom errors)
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
  }

  // Body parser / raw parser errors (e.g. payload too large)
  const knownStatus = (err as any).status ?? (err as any).statusCode;
  if (typeof knownStatus === "number" && knownStatus >= 400 && knownStatus < 600) {
    return res.status(knownStatus).json({
      success: false,
      message: err.message || "Request failed",
    });
  }

  // MongoDB validation errors
  if (err.name === "ValidationError") {
    const mongooseError = err as any;
    const errors = Object.keys(mongooseError.errors || {}).map((key) => ({
      field: key,
      message: mongooseError.errors[key].message,
    }));

    return res.status(400).json({
      success: false,
      message: "Validation error",
      errors,
    });
  }

  // MongoDB duplicate key error
  if ((err as any).code === 11000) {
    const field = Object.keys((err as any).keyPattern || {})[0] || "field";
    return res.status(409).json({
      success: false,
      message: `${field} already exists`,
    });
  }

  // MongoDB CastError (invalid ObjectId)
  if (err.name === "CastError") {
    return res.status(400).json({
      success: false,
      message: "Invalid ID format",
    });
  }

  // JWT errors
  if (err.name === "JsonWebTokenError") {
    return res.status(401).json({
      success: false,
      message: "Invalid token",
    });
  }

  if (err.name === "TokenExpiredError") {
    return res.status(401).json({
      success: false,
      message: "Token expired",
    });
  }

  // Default error
  return res.status(500).json({
    success: false,
    message: process.env.NODE_ENV === "production" 
      ? "Internal server error" 
      : err.message,
  });
};
