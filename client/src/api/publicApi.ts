export type BookLanguage = "ar" | "en" | "fr";

export interface StoryCategory {
  _id: string;
  name: string;
  description?: string;
  icon?: string;
}

export interface StoryPage {
  pageNumber: number;
  imageUrl: string;
  text?: string;
}

export interface StoryBook {
  _id: string;
  title: string;
  description: string;
  language: BookLanguage;
  minAge: number;
  maxAge: number;
  categories: StoryCategory[];
  coverUrl: string;
  pages: StoryPage[];
  createdAt?: string;
  updatedAt?: string;
}

interface ApiSuccess<T> {
  success: boolean;
  message?: string;
  data: T;
}

interface BookFilters {
  age?: number;
  lang?: BookLanguage;
  category?: string;
}

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5000").replace(/\/$/, "");

const toQueryString = (params: Record<string, string | number | undefined>) => {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "") {
      searchParams.set(key, String(value));
    }
  });
  const encoded = searchParams.toString();
  return encoded ? `?${encoded}` : "";
};

const getApiData = async <T>(path: string): Promise<T> => {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: { Accept: "application/json" },
  });

  const payload = (await response.json().catch(() => null)) as
    | ApiSuccess<T>
    | { message?: string }
    | null;

  if (!response.ok) {
    throw new Error(payload?.message ?? `Request failed (${response.status})`);
  }

  if (!payload || typeof payload !== "object" || !("data" in payload)) {
    throw new Error("The server returned an unexpected response.");
  }

  return payload.data;
};

const normalizeBook = (book: StoryBook): StoryBook => ({
  ...book,
  description: book.description ?? "",
  coverUrl: book.coverUrl ?? "",
  pages: [...(book.pages ?? [])].sort((a, b) => a.pageNumber - b.pageNumber),
  categories: book.categories ?? [],
});

export const fetchPublicBooks = async (filters: BookFilters): Promise<StoryBook[]> => {
  const data = await getApiData<StoryBook[]>(
    `/api/public/books${toQueryString({
      age: filters.age,
      lang: filters.lang,
      category: filters.category,
    })}`
  );

  return data.map(normalizeBook);
};

export const fetchPublicCategories = async (): Promise<StoryCategory[]> => {
  return getApiData<StoryCategory[]>("/api/public/categories");
};

