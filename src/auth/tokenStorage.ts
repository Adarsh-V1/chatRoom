const KEY = "convexChat.sessionToken";

export function getSessionToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

export function setSessionToken(token: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, token);
  } catch {
    // ignore
  }
}

export function clearSessionToken(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}
