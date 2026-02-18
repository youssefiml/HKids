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

export interface ReaderPairingClaimResult {
  device: {
    id: string;
    deviceId: string;
    deviceName?: string;
    pairedAt?: string;
  };
  childProfile: {
    id: string;
    name: string;
    age: number;
    dailyReadingLimitMinutes: number;
  };
}

export interface ReaderContext {
  paired: boolean;
  deviceId?: string;
  childProfileId?: string;
  childName?: string;
  dailyLimitMinutes?: number;
  usedMinutes?: number;
  remainingMinutes?: number;
  isLocked?: boolean;
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

const publicRequest = async <T>(
  path: string,
  options: RequestInit = {},
  deviceId?: string
): Promise<T> => {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      Accept: "application/json",
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(deviceId ? { "x-device-id": deviceId } : {}),
      ...((options.headers as Record<string, string> | undefined) ?? {}),
    },
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

export const fetchPublicBooks = async (filters: BookFilters, deviceId: string): Promise<StoryBook[]> => {
  const data = await publicRequest<StoryBook[]>(
    `/api/public/books${toQueryString({
      age: filters.age,
      lang: filters.lang,
      category: filters.category,
    })}`,
    { method: "GET" },
    deviceId
  );

  return data.map(normalizeBook);
};

export const fetchPublicBookById = async (id: string, deviceId: string): Promise<StoryBook> => {
  const book = await publicRequest<StoryBook>(`/api/public/books/${id}`, { method: "GET" }, deviceId);
  return normalizeBook(book);
};

export const fetchPublicCategories = async (deviceId: string): Promise<StoryCategory[]> => {
  return publicRequest<StoryCategory[]>("/api/public/categories", { method: "GET" }, deviceId);
};

export const claimReaderPairingCode = async (
  code: string,
  deviceId: string,
  deviceName?: string
): Promise<ReaderPairingClaimResult> => {
  return publicRequest<ReaderPairingClaimResult>(
    "/api/public/pairing/claim",
    {
      method: "POST",
      body: JSON.stringify({
        code,
        deviceId,
        ...(deviceName?.trim() ? { deviceName: deviceName.trim() } : {}),
      }),
    },
    deviceId
  );
};

export const fetchReaderContext = async (deviceId: string): Promise<ReaderContext> => {
  return publicRequest<ReaderContext>("/api/public/reader/context", { method: "GET" }, deviceId);
};
