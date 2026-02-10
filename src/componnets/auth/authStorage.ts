export type StoredAuth = {
  name: string;
  token: string;
};

const KEY = "convex-db-chat.auth.v1";

export function loadAuth(): StoredAuth | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<StoredAuth>;
    if (typeof parsed.name !== "string") return null;
    if (typeof parsed.token !== "string") return null;
    return { name: parsed.name, token: parsed.token };
  } catch {
    return null;
  }
}

export function saveAuth(auth: StoredAuth) {
  window.localStorage.setItem(KEY, JSON.stringify(auth));
}

export function clearAuth() {
  window.localStorage.removeItem(KEY);
}
