import dotenv from "dotenv";
import bcrypt from "bcrypt";
import { Types } from "mongoose";
import { connectDB } from "../config/db";
import { User } from "../modules/users/user.model";
import { Category } from "../modules/categories/category.model";
import { Book } from "../modules/books/book.model";

dotenv.config();

const DEFAULT_ADMIN = {
  email: "admin@hkids.com",
  password: "admin123",
  name: "Admin User",
};

const DEFAULT_BOOK_COUNT = 24;

const CATEGORY_TEMPLATES = [
  { name: "Animals", description: "Friendly stories with animals.", icon: "paw", minAge: 3, maxAge: 8 },
  { name: "Adventure", description: "Exploration and discovery tales.", icon: "compass", minAge: 5, maxAge: 12 },
  { name: "Science", description: "Simple stories that explain science ideas.", icon: "lab", minAge: 6, maxAge: 12 },
  { name: "Friendship", description: "Stories about sharing and teamwork.", icon: "heart", minAge: 4, maxAge: 10 },
  { name: "Nature", description: "Outdoor stories with forests, oceans, and skies.", icon: "leaf", minAge: 4, maxAge: 11 },
  { name: "Fantasy", description: "Magical worlds and imaginative creatures.", icon: "spark", minAge: 5, maxAge: 12 },
  { name: "Bedtime", description: "Soft and calming stories for night reading.", icon: "moon", minAge: 3, maxAge: 8 },
  { name: "Problem Solving", description: "Stories about creative thinking.", icon: "puzzle", minAge: 6, maxAge: 12 },
];

const TITLE_PREFIXES = [
  "The Curious",
  "The Little",
  "The Brave",
  "The Happy",
  "The Gentle",
  "The Clever",
  "The Tiny",
  "The Quiet",
  "The Bright",
];

const TITLE_NOUNS = [
  "Fox",
  "Explorer",
  "Dream",
  "Lantern",
  "River",
  "Robot",
  "Garden",
  "Star",
  "Castle",
  "Cloud",
  "Puzzle",
  "Comet",
];

const DESCRIPTION_SNIPPETS = [
  "A warm story that encourages curiosity and kindness.",
  "An easy-to-follow journey made for early readers.",
  "A playful tale with simple lessons and gentle humor.",
  "A short adventure that builds confidence and imagination.",
  "A calm story with heart, teamwork, and discovery.",
];

const PAGE_TEXT_SNIPPETS = [
  "The morning started with a small surprise and a big smile.",
  "Step by step, the friends worked together and stayed patient.",
  "They listened, shared ideas, and found a better way forward.",
  "A tiny clue appeared, and everyone looked closer.",
  "The path was new, but they moved ahead with courage.",
  "At sunset, they celebrated what they learned together.",
  "Back home, they remembered the day and felt proud.",
];

type SeedLanguage = "en" | "fr" | "ar";
const LANGUAGES: SeedLanguage[] = ["en", "fr", "ar"];

interface SeedCategory {
  _id: Types.ObjectId;
  name: string;
}

const randomInt = (min: number, max: number): number => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

const randomItem = <T>(items: T[]): T => {
  return items[randomInt(0, items.length - 1)];
};

const uniqueSubset = <T>(items: T[], count: number): T[] => {
  const shuffled = [...items].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
};

const parseBookCount = (): number => {
  const arg = process.argv.find((entry) => entry.startsWith("--books="));
  if (!arg) {
    return DEFAULT_BOOK_COUNT;
  }

  const value = Number(arg.split("=")[1]);
  if (!Number.isInteger(value) || value <= 0) {
    console.warn(`Invalid --books value. Using default of ${DEFAULT_BOOK_COUNT}.`);
    return DEFAULT_BOOK_COUNT;
  }

  return value;
};

const buildTitle = (usedTitles: Set<string>): string => {
  let title = "";
  while (!title || usedTitles.has(title)) {
    const prefix = randomItem(TITLE_PREFIXES);
    const noun = randomItem(TITLE_NOUNS);
    const suffix = randomInt(10, 999);
    title = `${prefix} ${noun} ${suffix}`;
  }
  usedTitles.add(title);
  return title;
};

const buildPages = (seedKey: string, pageCount: number) => {
  return Array.from({ length: pageCount }, (_, index) => {
    const pageNumber = index + 1;
    const imageSeed = `${seedKey}-page-${pageNumber}`;
    return {
      pageNumber,
      imageUrl: `https://picsum.photos/seed/${imageSeed}/960/1280`,
      text: randomItem(PAGE_TEXT_SNIPPETS),
    };
  });
};

const ensureAdminUser = async () => {
  const existingAdmin = await User.findOne({ email: DEFAULT_ADMIN.email });
  if (existingAdmin) {
    console.log("Admin user already exists.");
    return;
  }

  const hashedPassword = await bcrypt.hash(DEFAULT_ADMIN.password, 10);
  await User.create({
    email: DEFAULT_ADMIN.email,
    password: hashedPassword,
    name: DEFAULT_ADMIN.name,
    role: "admin",
    isActive: true,
  });

  console.log("Admin user created:");
  console.log(`  Email: ${DEFAULT_ADMIN.email}`);
  console.log(`  Password: ${DEFAULT_ADMIN.password}`);
  console.log("  Change this password after first login.");
};

const ensureCategories = async (): Promise<SeedCategory[]> => {
  const existingNames = new Set(
    (
      await Category.find({ name: { $in: CATEGORY_TEMPLATES.map((category) => category.name) } }).select("name").lean()
    ).map((category) => category.name)
  );

  const categoriesToCreate = CATEGORY_TEMPLATES.filter((category) => !existingNames.has(category.name)).map(
    (category, index) => ({
      ...category,
      order: index + 1,
      status: "active" as const,
    })
  );

  if (categoriesToCreate.length > 0) {
    await Category.insertMany(categoriesToCreate);
    console.log(`Created ${categoriesToCreate.length} categories.`);
  }

  return Category.find({ status: "active" }).select("_id name").lean<SeedCategory[]>();
};

const buildRandomBooks = (count: number, categories: SeedCategory[]) => {
  const usedTitles = new Set<string>();

  return Array.from({ length: count }, () => {
    const title = buildTitle(usedTitles);
    const minAge = randomInt(3, 10);
    const maxAge = Math.min(18, minAge + randomInt(2, 5));
    const pageCount = randomInt(4, 10);
    const selectedCategories = uniqueSubset(categories, randomInt(1, Math.min(3, categories.length)));
    const language = randomItem(LANGUAGES);
    const seedKey = title.toLowerCase().replace(/[^a-z0-9]+/g, "-");

    return {
      title,
      description: randomItem(DESCRIPTION_SNIPPETS),
      language,
      minAge,
      maxAge,
      categories: selectedCategories.map((category) => category._id),
      coverUrl: `https://picsum.photos/seed/${seedKey}-cover/600/900`,
      pages: buildPages(seedKey, pageCount),
      status: "published" as const,
      publishedAt: new Date(Date.now() - randomInt(0, 120) * 24 * 60 * 60 * 1000),
    };
  });
};

async function seed() {
  try {
    console.log("Starting database seed...");
    await connectDB(process.env.MONGO_URI as string);

    const isFreshSeed = process.argv.includes("--fresh");
    const targetBookCount = parseBookCount();

    if (isFreshSeed) {
      await Book.deleteMany({});
      await Category.deleteMany({});
      console.log("Cleared books and categories for fresh seed.");
    }

    await ensureAdminUser();
    const categories = await ensureCategories();

    if (categories.length === 0) {
      throw new Error("No categories available to attach books.");
    }

    const existingBookCount = await Book.countDocuments();
    const booksToCreate = Math.max(0, targetBookCount - existingBookCount);

    if (booksToCreate === 0) {
      console.log(`Books already seeded (${existingBookCount} records). Target is ${targetBookCount}.`);
      process.exit(0);
    }

    const books = buildRandomBooks(booksToCreate, categories);
    await Book.insertMany(books);

    console.log(`Created ${booksToCreate} random books.`);
    console.log(`Total books: ${existingBookCount + booksToCreate}`);
    process.exit(0);
  } catch (error) {
    console.error("Seed error:", error);
    process.exit(1);
  }
}

seed();
