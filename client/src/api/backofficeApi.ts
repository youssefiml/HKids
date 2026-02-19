import type { BookLanguage, StoryBook } from "./publicApi";
import { optimizeImageForUpload } from "../utils/imageUpload";

export type UserRole = "admin" | "editor";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

export interface AuthPayload {
  token: string;
  user: AuthUser;
}

export interface AdminBook extends StoryBook {
  status: "draft" | "review" | "published" | "archived";
  publishedAt?: string;
}

export interface AdminStoryPage {
  _id: string;
  order: number;
  imageUrl: string;
  text?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AdminStory {
  _id: string;
  title: string;
  description: string;
  language: BookLanguage;
  minAge: number;
  maxAge: number;
  coverImageUrl: string;
  status: "draft" | "published";
  publishedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
  pagesCount?: number;
  pages?: AdminStoryPage[];
}

export interface AdminUploadedImage {
  url: string;
  filename: string;
  size: number;
}

export interface CreateAdminBookInput {
  title: string;
  description: string;
  language: BookLanguage;
  minAge: number;
  maxAge: number;
}

interface ApiSuccess<T> {
  success: boolean;
  message?: string;
  data: T;
}

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5000").replace(/\/$/, "");

const parseResponse = async <T>(response: Response): Promise<T> => {
  const payload = (await response.json().catch(() => null)) as
    | ApiSuccess<T>
    | { message?: string }
    | null;

  if (!response.ok) {
    throw new Error(payload?.message ?? `Request failed (${response.status})`);
  }

  if (!payload || typeof payload !== "object" || !("data" in payload)) {
    throw new Error("Unexpected response from server.");
  }

  return payload.data;
};

const apiRequest = async <T>(
  path: string,
  options: RequestInit = {},
  token?: string
): Promise<T> => {
  const headers: Record<string, string> = {
    Accept: "application/json",
    ...(options.body ? { "Content-Type": "application/json" } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...((options.headers as Record<string, string> | undefined) ?? {}),
  };

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  return parseResponse<T>(response);
};

const normalizeAdminBook = (book: AdminBook): AdminBook => ({
  ...book,
  description: book.description ?? "",
  coverUrl: book.coverUrl ?? "",
  pages: [...(book.pages ?? [])].sort((a, b) => a.pageNumber - b.pageNumber),
  categories: book.categories ?? [],
});

export const loginBackoffice = async (email: string, password: string) => {
  return apiRequest<AuthPayload>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
};

export const getBackofficeMe = async (token: string) => {
  return apiRequest<AuthUser>("/api/auth/me", { method: "GET" }, token);
};

export const logoutBackoffice = async (token: string) => {
  return apiRequest<{ loggedOut: true }>("/api/auth/logout", { method: "POST" }, token);
};

export const getAdminBooks = async (token: string) => {
  const data = await apiRequest<AdminBook[]>("/api/admin/books", { method: "GET" }, token);
  return data.map(normalizeAdminBook);
};

export const createAdminBook = async (input: CreateAdminBookInput, token: string) => {
  const payload = {
    title: input.title,
    description: input.description,
    language: input.language,
    minAge: input.minAge,
    maxAge: input.maxAge,
    categories: [],
    coverUrl: "",
    pages: [
      {
        pageNumber: 1,
        imageUrl: `https://picsum.photos/seed/${encodeURIComponent(input.title)}-page-1/960/1280`,
        text: "Page one",
      },
    ],
    status: "draft",
  };

  return apiRequest<AdminBook>(
    "/api/admin/books",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
    token
  );
};

export const updateAdminBook = async (
  id: string,
  updates: Partial<Pick<AdminBook, "title" | "description" | "minAge" | "maxAge" | "language" | "status">>,
  token: string
) => {
  return apiRequest<AdminBook>(
    `/api/admin/books/${id}`,
    {
      method: "PATCH",
      body: JSON.stringify(updates),
    },
    token
  );
};

export const publishAdminBook = async (id: string, token: string) => {
  return apiRequest<AdminBook>(`/api/admin/books/${id}/publish`, { method: "POST" }, token);
};

export const archiveAdminBook = async (id: string, token: string) => {
  return updateAdminBook(id, { status: "archived" }, token);
};

export const getAdminStories = async (
  token: string,
  filters?: { status?: "draft" | "published"; language?: BookLanguage; search?: string }
) => {
  const query = new URLSearchParams();
  if (filters?.status) {
    query.set("status", filters.status);
  }
  if (filters?.language) {
    query.set("language", filters.language);
  }
  if (filters?.search?.trim()) {
    query.set("search", filters.search.trim());
  }

  const path = `/api/admin/stories${query.toString() ? `?${query.toString()}` : ""}`;
  return apiRequest<AdminStory[]>(path, { method: "GET" }, token);
};

export const getAdminStoryById = async (storyId: string, token: string) => {
  return apiRequest<AdminStory>(`/api/admin/stories/${storyId}`, { method: "GET" }, token);
};

export const createAdminStory = async (
  payload: {
    title: string;
    description?: string;
    language: BookLanguage;
    minAge: number;
    maxAge: number;
    coverImageUrl?: string;
  },
  token: string
) => {
  return apiRequest<AdminStory>(
    "/api/admin/stories",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
    token
  );
};

export const updateAdminStory = async (
  storyId: string,
  payload: Partial<{
    title: string;
    description: string;
    language: BookLanguage;
    minAge: number;
    maxAge: number;
    coverImageUrl: string;
  }>,
  token: string
) => {
  return apiRequest<AdminStory>(
    `/api/admin/stories/${storyId}`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    },
    token
  );
};

export const deleteAdminStory = async (storyId: string, token: string) => {
  return apiRequest<{ deleted: boolean }>(`/api/admin/stories/${storyId}`, { method: "DELETE" }, token);
};

export const addAdminStoryPage = async (
  storyId: string,
  payload: { imageUrl?: string; text?: string; order?: number },
  token: string
) => {
  return apiRequest<AdminStoryPage>(
    `/api/admin/stories/${storyId}/pages`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
    token
  );
};

export const updateAdminStoryPage = async (
  storyId: string,
  pageId: string,
  payload: { imageUrl?: string; text?: string },
  token: string
) => {
  return apiRequest<AdminStoryPage>(
    `/api/admin/stories/${storyId}/pages/${pageId}`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    },
    token
  );
};

export const deleteAdminStoryPage = async (storyId: string, pageId: string, token: string) => {
  return apiRequest<{ deleted: boolean }>(
    `/api/admin/stories/${storyId}/pages/${pageId}`,
    {
      method: "DELETE",
    },
    token
  );
};

export const reorderAdminStoryPages = async (storyId: string, pageIds: string[], token: string) => {
  return apiRequest<AdminStoryPage[]>(
    `/api/admin/stories/${storyId}/pages/reorder`,
    {
      method: "PATCH",
      body: JSON.stringify({ pageIds }),
    },
    token
  );
};

export const setAdminStoryPublished = async (storyId: string, published: boolean, token: string) => {
  return apiRequest<AdminStory>(
    `/api/admin/stories/${storyId}/publish`,
    {
      method: "PATCH",
      body: JSON.stringify({ published }),
    },
    token
  );
};

export const uploadAdminStoryImage = async (file: File, token: string) => {
  const optimizedFile = await optimizeImageForUpload(file, {
    maxWidth: 1920,
    maxHeight: 1920,
    quality: 0.82,
    preferredType: "image/webp",
    keepOriginalIfSmaller: true,
  });

  const lowerName = optimizedFile.name.toLowerCase();
  const fallbackType = lowerName.endsWith(".png")
    ? "image/png"
    : lowerName.endsWith(".webp")
      ? "image/webp"
      : lowerName.endsWith(".gif")
        ? "image/gif"
        : "image/jpeg";

  const response = await fetch(`${API_BASE_URL}/api/admin/stories/upload-image`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
      "Content-Type": optimizedFile.type || fallbackType,
    },
    body: optimizedFile,
  });

  return parseResponse<AdminUploadedImage>(response);
};
