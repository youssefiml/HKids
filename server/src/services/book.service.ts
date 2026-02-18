import { Book, IBook } from "../modules/books/book.model";
import { Story } from "../modules/stories/story.model";
import { StoryPage } from "../modules/stories/storyPage.model";
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

type PublicCategoryView = {
  _id: string;
  name: string;
};

type PublicPageView = {
  pageNumber: number;
  imageUrl: string;
  text?: string;
};

export type PublicBookView = {
  _id: string;
  title: string;
  description: string;
  language: string;
  minAge: number;
  maxAge: number;
  categories: PublicCategoryView[];
  coverUrl: string;
  pages: PublicPageView[];
  createdAt?: Date;
  updatedAt?: Date;
};

const normalizeBookCategories = (categories: unknown[]): PublicCategoryView[] => {
  return categories
    .map((category) => {
      if (!category || typeof category !== "object") {
        return null;
      }

      const categoryRecord = category as { _id?: Types.ObjectId | string; name?: string };
      if (!categoryRecord._id || typeof categoryRecord.name !== "string" || !categoryRecord.name.trim()) {
        return null;
      }

      return {
        _id: String(categoryRecord._id),
        name: categoryRecord.name,
      };
    })
    .filter((category): category is PublicCategoryView => category !== null);
};

const normalizeBookDocument = (book: IBook & { _id: Types.ObjectId }): PublicBookView => {
  const rawPages = Array.isArray(book.pages) ? book.pages : [];
  const sortedPages = [...rawPages].sort((a, b) => a.pageNumber - b.pageNumber);

  return {
    _id: book._id.toString(),
    title: book.title,
    description: book.description ?? "",
    language: book.language,
    minAge: book.minAge,
    maxAge: book.maxAge,
    categories: normalizeBookCategories(book.categories as unknown[]),
    coverUrl: book.coverUrl ?? "",
    pages: sortedPages.map((page) => ({
      pageNumber: page.pageNumber,
      imageUrl: page.imageUrl,
      text: page.text ?? "",
    })),
    createdAt: book.createdAt,
    updatedAt: book.updatedAt,
  };
};

const serializeStoryAsPublicBook = (
  story: {
    _id: Types.ObjectId;
    title: string;
    description?: string;
    language: string;
    minAge: number;
    maxAge: number;
    coverImageUrl?: string;
    createdAt?: Date;
    updatedAt?: Date;
  },
  pages: Array<{ order: number; imageUrl?: string; text?: string }>
): PublicBookView => {
  const sortedPages = [...pages].sort((a, b) => a.order - b.order);
  return {
    _id: story._id.toString(),
    title: story.title,
    description: story.description ?? "",
    language: story.language,
    minAge: story.minAge,
    maxAge: story.maxAge,
    categories: [],
    coverUrl: story.coverImageUrl ?? "",
    pages: sortedPages.map((page) => ({
      pageNumber: page.order,
      imageUrl: page.imageUrl ?? "",
      text: page.text ?? "",
    })),
    createdAt: story.createdAt,
    updatedAt: story.updatedAt,
  };
};

export const getBooks = async (
  filters: BookFilters,
  isAdmin: boolean = false,
  pagination?: PaginationOptions
): Promise<IBook[] | PaginatedResponse<IBook> | PublicBookView[]> => {
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

  if (!isAdmin) {
    const publishedBooks = await findQuery.limit(50);
    const normalizedBooks = publishedBooks.map((book) => normalizeBookDocument(book));

    if (filters.category) {
      return normalizedBooks;
    }

    const storyQuery: Record<string, any> = { status: "published" };
    if (filters.age !== undefined) {
      storyQuery.minAge = { $lte: Number(filters.age) };
      storyQuery.maxAge = { $gte: Number(filters.age) };
    }
    if (filters.language) {
      storyQuery.language = filters.language.toLowerCase();
    }

    const stories = await Story.find(storyQuery).sort({ createdAt: -1 }).limit(50);
    if (!stories.length) {
      return normalizedBooks;
    }

    const pages = await StoryPage.find({
      story: { $in: stories.map((story) => story._id) },
    }).sort({ order: 1 });

    const pagesByStoryId = new Map<string, typeof pages>();
    stories.forEach((story) => {
      pagesByStoryId.set(story._id.toString(), []);
    });

    pages.forEach((page) => {
      const storyId = page.story.toString();
      const list = pagesByStoryId.get(storyId);
      if (list) {
        list.push(page);
      }
    });

    const normalizedStories = stories.map((story) =>
      serializeStoryAsPublicBook(story, pagesByStoryId.get(story._id.toString()) ?? [])
    );

    return [...normalizedBooks, ...normalizedStories]
      .sort((a, b) => {
        const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return bTime - aTime;
      })
      .slice(0, 50);
  }

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

  return await findQuery.limit(50);
};

export const getBookById = async (id: string, isAdmin: boolean = false) => {
  validateObjectId(id, "Book ID");

  if (!isAdmin) {
    const publishedBook = await Book.findOne({ _id: id, status: "published" }).populate("categories", "name");
    if (publishedBook) {
      return normalizeBookDocument(publishedBook);
    }

    const publishedStory = await Story.findOne({ _id: id, status: "published" });
    if (!publishedStory) {
      throw new AppError("Book not found", 404);
    }

    const pages = await StoryPage.find({ story: publishedStory._id }).sort({ order: 1 });
    return serializeStoryAsPublicBook(publishedStory, pages);
  }

  const book = await Book.findOne({ _id: id }).populate("categories", "name");
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
