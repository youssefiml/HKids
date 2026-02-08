import { Book, IBook } from "../modules/books/book.model";
import { AppError } from "../middlewares/error.middleware";
import { Types } from "mongoose";
import { validateObjectId, validateAgeRange } from "../utils/validators.util";
import { PaginationOptions, PaginatedResponse } from "../utils/pagination.util";

export interface BookFilters {
  age?: number;
  language?: string;
  category?: string;
  status?: string;
}

export interface GetBooksOptions extends BookFilters {
  pagination?: PaginationOptions;
}

export const getBooks = async (
  filters: BookFilters,
  isAdmin: boolean = false,
  pagination?: PaginationOptions
): Promise<IBook[] | PaginatedResponse<IBook>> => {
  const query: any = {};

  // Public users can only see published books
  if (!isAdmin) {
    query.status = "published";
  } else if (filters.status) {
    query.status = filters.status;
  }

  // Age filter
  if (filters.age !== undefined) {
    const age = Number(filters.age);
    if (isNaN(age) || age < 0 || age > 18) {
      throw new AppError("Invalid age value. Must be between 0 and 18", 400);
    }
    query.minAge = { $lte: age };
    query.maxAge = { $gte: age };
  }

  // Language filter
  if (filters.language) {
    const validLanguages = ["ar", "en", "fr"];
    if (!validLanguages.includes(filters.language.toLowerCase())) {
      throw new AppError("Invalid language. Must be one of: ar, en, fr", 400);
    }
    query.language = filters.language.toLowerCase();
  }

  // Category filter
  if (filters.category) {
    validateObjectId(filters.category, "Category");
    query.categories = new Types.ObjectId(filters.category);
  }

  // Build query
  const findQuery = Book.find(query).populate("categories", "name").sort({ createdAt: -1 });

  // Apply pagination if provided
  if (pagination) {
    const total = await Book.countDocuments(query);
    const books = await findQuery.skip(pagination.skip).limit(pagination.limit);
    
    return {
      data: books,
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total,
        totalPages: Math.ceil(total / pagination.limit),
      },
    };
  }

  // Return without pagination (default limit 50)
  return await findQuery.limit(50);
};

export const getBookById = async (id: string, isAdmin: boolean = false) => {
  validateObjectId(id, "Book ID");
  
  const query: any = { _id: id };
  
  if (!isAdmin) {
    query.status = "published";
  }

  const book = await Book.findOne(query).populate("categories", "name");
  if (!book) {
    throw new AppError("Book not found", 404);
  }

  return book;
};

export const createBook = async (bookData: any) => {
  // Validate age range
  if (bookData.minAge !== undefined && bookData.maxAge !== undefined) {
    validateAgeRange(bookData.minAge, bookData.maxAge);
  }

  // Validate categories if provided
  if (bookData.categories && Array.isArray(bookData.categories)) {
    bookData.categories = bookData.categories.map((catId: string) => {
      validateObjectId(catId, "Category");
      return new Types.ObjectId(catId);
    });
  }

  return await Book.create(bookData);
};

export const updateBook = async (id: string, bookData: any) => {
  validateObjectId(id, "Book ID");

  // Validate age range if both are being updated
  if (bookData.minAge !== undefined && bookData.maxAge !== undefined) {
    validateAgeRange(bookData.minAge, bookData.maxAge);
  }

  // Validate categories if provided
  if (bookData.categories && Array.isArray(bookData.categories)) {
    bookData.categories = bookData.categories.map((catId: string) => {
      validateObjectId(catId, "Category");
      return new Types.ObjectId(catId);
    });
  }

  const book = await Book.findByIdAndUpdate(id, bookData, { new: true, runValidators: true });
  if (!book) {
    throw new AppError("Book not found", 404);
  }
  return book;
};

export const publishBook = async (id: string) => {
  validateObjectId(id, "Book ID");
  
  const book = await Book.findByIdAndUpdate(
    id,
    { status: "published", publishedAt: new Date() },
    { new: true }
  );
  if (!book) {
    throw new AppError("Book not found", 404);
  }
  return book;
};

export const deleteBook = async (id: string) => {
  validateObjectId(id, "Book ID");
  
  const book = await Book.findByIdAndDelete(id);
  if (!book) {
    throw new AppError("Book not found", 404);
  }
  return book;
};
