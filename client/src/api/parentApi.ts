export interface ParentAccount {
  id: string;
  email: string;
  isActive: boolean;
}

export interface ParentAuthPayload {
  token: string;
  parent: ParentAccount;
}

export interface ParentChildProfile {
  _id: string;
  name: string;
  age: number;
  dailyReadingLimitMinutes: number;
  isActive: boolean;
}

export interface ParentWeeklyDigestDailyItem {
  date: string;
  minutes: number;
}

export interface ParentWeeklyDigestChild {
  childProfileId: string;
  childName: string;
  age: number;
  dailyLimitMinutes: number;
  totalMinutes: number;
  activeDays: number;
  averageMinutesPerActiveDay: number;
  consistencyScore: number;
  trend: "up" | "down" | "steady";
  recommendation: string;
  dailyBreakdown: ParentWeeklyDigestDailyItem[];
}

export interface ParentWeeklyDigest {
  generatedAt: string;
  period: {
    startDate: string;
    endDate: string;
    days: number;
  };
  summary: {
    childrenCount: number;
    totalMinutes: number;
    readingDays: number;
    topReader: {
      childProfileId: string;
      childName: string;
      totalMinutes: number;
    } | null;
    nextStep: string;
  };
  children: ParentWeeklyDigestChild[];
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

const parentRequest = async <T>(path: string, options: RequestInit = {}, token?: string): Promise<T> => {
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

export const loginParent = async (email: string, password: string) => {
  return parentRequest<ParentAuthPayload>("/api/parent/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
};

export const getParentMe = async (token: string) => {
  return parentRequest<ParentAccount>("/api/parent/auth/me", { method: "GET" }, token);
};

export const listParentChildren = async (token: string) => {
  return parentRequest<ParentChildProfile[]>("/api/parent/children", { method: "GET" }, token);
};

export const getParentWeeklyDigest = async (token: string, childProfileId?: string) => {
  const query = childProfileId ? `?childProfileId=${encodeURIComponent(childProfileId)}` : "";
  return parentRequest<ParentWeeklyDigest>(`/api/parent/insights/weekly${query}`, { method: "GET" }, token);
};
