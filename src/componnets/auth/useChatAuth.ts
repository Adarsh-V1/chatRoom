"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";

import { api } from "@/convex/_generated/api";
import { clearAuth, loadAuth, saveAuth } from "@/src/componnets/auth/authStorage";

type LoginArgs = {
  name: string;
  password: string;
};

export function useChatAuth() {
  const [token, setToken] = useState<string | null>(null);
  const [name, setName] = useState<string | null>(null);

  const loginOrRegister = useMutation(api.auth.loginOrRegister);

  useEffect(() => {
    const stored = loadAuth();
    if (!stored) return;
    setToken(stored.token);
    setName(stored.name);
  }, []);

  const me = useQuery(api.auth.getSessionUser, token ? { token } : "skip");

  useEffect(() => {
    if (!token) return;
    if (me === undefined) return;
    if (me) {
      setName(me.name);
      saveAuth({ token, name: me.name });
      return;
    }
    clearAuth();
    setToken(null);
    setName(null);
  }, [me, token]);

  const login = async ({ name: rawName, password }: LoginArgs) => {
    const result = await loginOrRegister({ name: rawName, password });
    setToken(result.token);
    setName(result.name);
    saveAuth({ token: result.token, name: result.name });
    return result;
  };

  const logout = () => {
    clearAuth();
    setToken(null);
    setName(null);
  };

  return useMemo(
    () => ({
      token,
      name,
      me,
      login,
      logout,
      isLoggedIn: Boolean(token && name),
    }),
    [token, name, me]
  );
}
