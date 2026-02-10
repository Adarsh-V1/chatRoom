"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";

import { api } from "@/convex/_generated/api";
import { clearSessionToken, getSessionToken, setSessionToken } from "./tokenStorage";

export type SessionUser = {
  name: string;
  profilePictureUrl: string | null;
};

export function useSession() {
  const [token, setTokenState] = useState<string | null>(() => getSessionToken());

  const sessionUser = useQuery(
    api.auth.getSessionUser,
    typeof token === "string" ? { token } : "skip"
  );

  const touchSession = useMutation(api.auth.touchSession);

  useEffect(() => {
    if (typeof token !== "string") return;
    void touchSession({ token });
  }, [token, touchSession]);

  const setToken = (next: string) => {
    setSessionToken(next);
    setTokenState(next);
  };

  const clearToken = () => {
    clearSessionToken();
    setTokenState(null);
  };

  const isReady = useMemo(() => {
    if (token === null) return true;
    return sessionUser !== undefined;
  }, [token, sessionUser]);

  return {
    token: typeof token === "string" ? token : null,
    sessionUser: sessionUser ?? null,
    setToken,
    clearToken,
    isReady,
  };
}
