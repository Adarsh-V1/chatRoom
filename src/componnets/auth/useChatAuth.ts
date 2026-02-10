"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";

import { api } from "@/convex/_generated/api";
import { clearAuth, loadAuth, saveAuth } from "@/src/componnets/auth/authStorage";

type LoginArgs = {
  name: string;
  password: string;
};

export function useChatAuth() {
  const [auth, setAuth] = useState<{ token: string; name: string } | null>(() => loadAuth());
  const [hydrated, setHydrated] = useState(false);

  const token = auth?.token ?? null;
  const name = auth?.name ?? null;

  const loginOrRegister = useMutation(api.auth.loginOrRegister);

  const me = useQuery(api.auth.getSessionUser, token ? { token } : "skip");

  useEffect(() => {
    setHydrated(true);
  }, []);

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

  const login = useCallback(async ({ name: rawName, password }: LoginArgs) => {
    const result = await loginOrRegister({ name: rawName, password });
    const next = { token: result.token, name: result.name };
    saveAuth(next);
    setAuth(next);
    return result;
  }, [loginOrRegister]);

  const logout = useCallback(() => {
    clearAuth();
    setAuth(null);
  }, []);

  const resolvedName = useMemo(() => me?.name ?? name, [me?.name, name]);
  const isReady = hydrated && (token ? me !== undefined : true);

  return {
    token,
    name: resolvedName,
    me,
    login,
    logout,
    isReady,
    isLoggedIn: hydrated && Boolean(token && me),
  };
}
