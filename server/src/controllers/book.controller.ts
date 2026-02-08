import { Response, NextFunction } from "express";
import { AuthRequest } from "../middlewares/auth.middleware";
import { getBooks, getBookById, createBook, updateBook, publishBook, deleteBook } from "../services/book.service";
import { sendSuccess } from "../utils/response.util";
import { getPaginationParams } from "../utils/pagination.util";
import { AppError } from "../middlewares/error.middleware";
import { consumeReadingMinutes } from "../services/devicePairing.service";

export const getBooksController = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const isAdmin = req.user?.role === "admin" || req.user?.role === "editor";
    const enforcedAge = !isAdmin && req.readerContext?.isPaired ? req.readerContext.childAge : undefined;
    const filters = {
      age: enforcedAge ?? (req.query.age ? Number(req.query.age) : undefined),
      language: req.query.lang as string | undefined,
      category: req.query.category as string | undefined,
      status: req.query.status as string | undefined,
    };
    
    // Use pagination for admin, simple list for public
    const pagination = isAdmin && req.query.page ? getPaginationParams(req) : undefined;
    const books = await getBooks(filters, isAdmin, pagination);
    
    sendSuccess(res, books);
  } catch (error) {
    next(error);
  }
};

export const getBookByIdController = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const isAdmin = req.user?.role === "admin" || req.user?.role === "editor";
    const readerContext = !isAdmin ? req.readerContext : undefined;

    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const book = await getBookById(id, isAdmin);

    if (readerContext?.isPaired && readerContext.childAge !== undefined) {
      const childAge = readerContext.childAge;
      if (book.minAge > childAge || book.maxAge < childAge) {
        throw new AppError("This book is restricted for the active child profile", 403);
      }
      if ((readerContext.remainingMinutes ?? 0) <= 0) {
        throw new AppError("Daily reading limit reached for this child profile", 423);
      }
      await consumeReadingMinutes(readerContext.deviceId, 1);
    }

    sendSuccess(res, book);
  } catch (error) {
    next(error);
  }
};

export const createBookController = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (
      req.user?.role === "editor" &&
      (req.body?.status === "published" ||
        req.body?.status === "archived" ||
        req.body?.publishedAt !== undefined)
    ) {
      throw new AppError("Only admin can publish or archive books", 403);
    }

    const book = await createBook(req.body);
    sendSuccess(res, book, "Book created successfully", 201);
  } catch (error) {
    next(error);
  }
};

export const updateBookController = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (
      req.user?.role === "editor" &&
      (req.body?.status === "published" ||
        req.body?.status === "archived" ||
        req.body?.publishedAt !== undefined)
    ) {
      throw new AppError("Only admin can publish or archive books", 403);
    }

    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const book = await updateBook(id, req.body);
    sendSuccess(res, book, "Book updated successfully");
  } catch (error) {
    next(error);
  }
};

export const publishBookController = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const book = await publishBook(id);
    sendSuccess(res, book, "Book published successfully");
  } catch (error) {
    next(error);
  }
};

export const deleteBookController = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    await deleteBook(id);
    sendSuccess(res, null, "Book deleted successfully");
  } catch (error) {
    next(error);
  }
};
