"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";

import { api } from "@/convex/_generated/api";
import { clearAuth, loadAuth, saveAuth } from "@/src/features/auth/authStorage";
import { markTourPending } from "@/src/features/onboarding/tourStorage";

type LoginArgs = {
  name: string;
  password: string;
};

type LoginResponse = {
  token: string;
  name: string;
  isNewUser?: boolean;
};

type GoogleLoginResponse = {
  ok: boolean;
  token?: string;
  name?: string;
  isNewUser?: boolean;
  error?: string;
};

export function useChatAuth() {
  const [auth, setAuth] = useState<{ token: string; name: string } | null>(() => loadAuth());
  const [hydrated, setHydrated] = useState(false);

  const token = auth?.token ?? null;
  const name = auth?.name ?? null;

  const loginOrRegister = useMutation(api.auth.loginOrRegister);
  const touchSession = useMutation(api.auth.touchSession);
  const pingPresence = useMutation(api.presence.ping);
  const revokeSession = useMutation(api.auth.revokeSession);

  const me = useQuery(api.auth.getSessionUser, token ? { token } : "skip");

  useEffect(() => {
    queueMicrotask(() => setHydrated(true));
  }, []);

  useEffect(() => {
    if (!token || !me) return;

    let cancelled = false;

    const ping = async () => {
      if (cancelled) return;
      try {
        await touchSession({ token });
        await pingPresence({ token });
      } catch {
        // Ignore transient errors.
      }
    };

    void ping();
    const interval = setInterval(ping, 20_000);

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        void ping();
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      cancelled = true;
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [token, me, touchSession, pingPresence]);

  useEffect(() => {
    if (!token) return;
    if (me === undefined) return;
    if (me) {
      saveAuth({ token, name: me.name });
      if (auth?.name !== me.name) {
        queueMicrotask(() => setAuth({ token, name: me.name }));
      }
      return;
    }
    clearAuth();
    queueMicrotask(() => setAuth(null));
  }, [me, token, auth?.name]);

  const login = useCallback(
    async ({ name: rawName, password }: LoginArgs) => {
      const result = await loginOrRegister({ name: rawName, password });
      const next = { token: result.token, name: result.name };
      saveAuth(next);
      setAuth(next);
      if (result.isNewUser) {
        markTourPending(result.name);
      }
      return result;
    },
    [loginOrRegister]
  );

  const loginWithGoogle = useCallback(async (credential: string) => {
    const response = await fetch("/api/auth/google", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ credential }),
    });

    const json = (await response.json()) as GoogleLoginResponse;
    if (!response.ok || !json.ok || !json.token || !json.name) {
      throw new Error(json.error ?? "Google login failed");
    }

    const next = { token: json.token, name: json.name };
    saveAuth(next);
    setAuth(next);
    if (json.isNewUser) {
      markTourPending(json.name);
    }
    return { ...next, isNewUser: json.isNewUser } satisfies LoginResponse;
  }, []);

  const logout = useCallback(async () => {
    if (token) {
      try {
        await revokeSession({ token });
      } catch {
        // Ignore revocation errors and clear local state anyway.
      }
    }
    clearAuth();
    setAuth(null);
  }, [token, revokeSession]);

  const resolvedName = useMemo(() => me?.name ?? name, [me?.name, name]);
  const isLoggedIn = hydrated && Boolean(token && me);
  const isReady = hydrated && (token ? me !== undefined : true);

  return {
    token,
    name: resolvedName,
    me,
    login,
    loginWithGoogle,
    logout,
    isReady,
    isLoggedIn,
  };
}
