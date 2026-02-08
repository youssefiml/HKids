import type { BookLanguage, StoryBook } from "./publicApi";

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
