import { optimizeImageForUpload } from "../utils/imageUpload";

export interface ParentAccount {
  id: string;
  fullName: string;
  email: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface ParentAuthPayload {
  token: string;
  parent: ParentAccount;
}

export interface CreateParentChildInput {
  name: string;
  age: number;
  dailyReadingLimitMinutes: number;
}

export interface UpdateParentChildInput {
  name?: string;
  age?: number;
  dailyReadingLimitMinutes?: number;
  avatarImageUrl?: string;
}

export interface ParentChildProfile {
  _id: string;
  name: string;
  age: number;
  dailyReadingLimitMinutes: number;
  avatarImageUrl?: string;
  isActive: boolean;
}

export interface UpdateParentProfileInput {
  fullName?: string;
  email?: string;
}

export interface UpdateParentPasswordInput {
  currentPassword: string;
  newPassword: string;
}

export interface ParentPairingCode {
  id: string;
  code: string;
  expiresAt: string;
  childProfile: {
    id: string;
    name: string;
    age: number;
    dailyReadingLimitMinutes: number;
  };
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

interface ApiErrorPayload {
  message?: string;
  errors?: Array<{
    field?: string;
    message?: string;
  }>;
}

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5000").replace(/\/$/, "");

const fileToDataUrl = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
      } else {
        reject(new Error("Could not process image upload."));
      }
    };
    reader.onerror = () => reject(new Error("Could not read image file."));
    reader.readAsDataURL(file);
  });
};

const parseResponse = async <T>(response: Response): Promise<T> => {
  const payload = (await response.json().catch(() => null)) as ApiSuccess<T> | ApiErrorPayload | null;

  if (!response.ok) {
    const validationMessage =
      payload &&
      typeof payload === "object" &&
      "errors" in payload &&
      Array.isArray(payload.errors)
        ? payload.errors.find((item) => typeof item?.message === "string")?.message
        : undefined;

    const errorMessage = [payload?.message, validationMessage].filter(Boolean).join(": ");
    throw new Error(errorMessage || `Request failed (${response.status})`);
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

export const registerParent = async (email: string, password: string) => {
  return parentRequest<ParentAuthPayload>("/api/parent/auth/register", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
};

export const getParentMe = async (token: string) => {
  return parentRequest<ParentAccount>("/api/parent/auth/me", { method: "GET" }, token);
};

export const updateParentMe = async (token: string, input: UpdateParentProfileInput) => {
  return parentRequest<ParentAccount>(
    "/api/parent/auth/me",
    {
      method: "PATCH",
      body: JSON.stringify(input),
    },
    token
  );
};

export const updateParentPassword = async (token: string, input: UpdateParentPasswordInput) => {
  return parentRequest<{ updated: true }>(
    "/api/parent/auth/me/password",
    {
      method: "PATCH",
      body: JSON.stringify(input),
    },
    token
  );
};

export const listParentChildren = async (token: string) => {
  return parentRequest<ParentChildProfile[]>("/api/parent/children", { method: "GET" }, token);
};

export const createParentChild = async (token: string, input: CreateParentChildInput) => {
  return parentRequest<ParentChildProfile>(
    "/api/parent/children",
    {
      method: "POST",
      body: JSON.stringify(input),
    },
    token
  );
};

export const updateParentChild = async (
  token: string,
  childProfileId: string,
  input: UpdateParentChildInput
) => {
  return parentRequest<ParentChildProfile>(
    `/api/parent/children/${childProfileId}`,
    {
      method: "PATCH",
      body: JSON.stringify(input),
    },
    token
  );
};

export const deleteParentChild = async (token: string, childProfileId: string) => {
  return parentRequest<ParentChildProfile>(`/api/parent/children/${childProfileId}`, { method: "DELETE" }, token);
};

export const uploadParentChildAvatar = async (token: string, childProfileId: string, file: File) => {
  const optimizedFile = await optimizeImageForUpload(file, {
    maxWidth: 640,
    maxHeight: 640,
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

  const response = await fetch(`${API_BASE_URL}/api/parent/children/${childProfileId}/avatar`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
      "Content-Type": optimizedFile.type || fallbackType,
    },
    body: optimizedFile,
  });

  if (response.status === 404) {
    const avatarImageUrl = await fileToDataUrl(optimizedFile);
    return updateParentChild(token, childProfileId, { avatarImageUrl });
  }

  return parseResponse<ParentChildProfile>(response);
};

export const createParentPairingCode = async (
  token: string,
  childProfileId: string,
  expiresInMinutes?: number
) => {
  return parentRequest<ParentPairingCode>(
    "/api/parent/devices/pairing-codes",
    {
      method: "POST",
      body: JSON.stringify({
        childProfileId,
        ...(expiresInMinutes ? { expiresInMinutes } : {}),
      }),
    },
    token
  );
};

export const getParentWeeklyDigest = async (token: string, childProfileId?: string) => {
  const query = childProfileId ? `?childProfileId=${encodeURIComponent(childProfileId)}` : "";
  return parentRequest<ParentWeeklyDigest>(`/api/parent/insights/weekly${query}`, { method: "GET" }, token);
};
