export interface ReaderSession {
  deviceId: string;
  childProfileId: string;
  childName: string;
}

const READER_SESSION_STORAGE_KEY = "hkids_reader_session";

const canUseStorage = () => typeof window !== "undefined" && typeof window.localStorage !== "undefined";

export const getStoredReaderSession = (): ReaderSession | null => {
  if (!canUseStorage()) {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(READER_SESSION_STORAGE_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as Partial<ReaderSession>;
    if (
      typeof parsed?.deviceId !== "string" ||
      typeof parsed?.childProfileId !== "string" ||
      typeof parsed?.childName !== "string"
    ) {
      return null;
    }

    return {
      deviceId: parsed.deviceId,
      childProfileId: parsed.childProfileId,
      childName: parsed.childName,
    };
  } catch {
    return null;
  }
};

export const setStoredReaderSession = (session: ReaderSession) => {
  if (!canUseStorage()) {
    return;
  }

  try {
    window.localStorage.setItem(READER_SESSION_STORAGE_KEY, JSON.stringify(session));
  } catch {
    // no-op
  }
};

export const clearStoredReaderSession = () => {
  if (!canUseStorage()) {
    return;
  }

  try {
    window.localStorage.removeItem(READER_SESSION_STORAGE_KEY);
  } catch {
    // no-op
  }
};

export const getOrCreateReaderDeviceId = () => {
  const existing = getStoredReaderSession()?.deviceId;
  if (existing) {
    return existing;
  }

  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `hkids-${crypto.randomUUID()}`;
  }

  const fallback = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  return `hkids-${fallback}`;
};
