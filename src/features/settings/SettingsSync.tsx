"use client";

import { useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useChatAuth } from "@/src/features/auth/useChatAuth";

export function SettingsSync() {
  const auth = useChatAuth();
  const token = auth.token ?? "";
  const settings = useQuery(api.settings.getMySettings, token ? { token } : "skip");

  useEffect(() => {
    const root = document.documentElement;
    if (!settings) {
      root.removeAttribute("data-contrast");
      return;
    }

    if (settings.highContrast) {
      root.setAttribute("data-contrast", "high");
    } else {
      root.removeAttribute("data-contrast");
    }
  }, [settings]);

  return null;
}
