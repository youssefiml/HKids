import { z } from "zod";
import { Request, Response, NextFunction } from "express";

export const validate = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          message: "Validation error",
          errors: error.issues.map((issue) => ({
            field: issue.path.join("."),
            message: issue.message,
          })),
        });
      }
      next(error);
    }
  };
};

// Validation schemas
export const pageSchema = z.object({
  pageNumber: z.number().int().min(1),
  imageUrl: z.string().url(),
  text: z.string().optional(),
});

export const bookSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  language: z.enum(["ar", "en", "fr"]),
  minAge: z.number().int().min(0).max(18),
  maxAge: z.number().int().min(0).max(18),
  categories: z.array(z.string()).optional(),
  coverUrl: z.string().url().optional().or(z.literal("")),
  pages: z.array(pageSchema).optional(),
  status: z.enum(["draft", "review", "published", "archived"]).optional(),
});

export const categorySchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  icon: z.string().optional(),
  order: z.number().int().min(0).optional(),
  minAge: z.number().int().min(0).max(18).optional(),
  maxAge: z.number().int().min(0).max(18).optional(),
  status: z.enum(["active", "inactive"]).optional(),
});

export const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(8),
});

export const registerSchema = z.object({
  email: z.string().trim().email(),
  password: z
    .string()
    .min(8)
    .max(128)
    .regex(/[A-Za-z]/, "Password must include at least one letter")
    .regex(/\d/, "Password must include at least one number"),
  name: z.string().trim().min(1).max(100),
  role: z.enum(["admin", "editor"]).optional(),
});
