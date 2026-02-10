"use client";

import React, { useMemo } from "react";
import { useMutation, useQuery } from "convex/react";

import { api } from "@/convex/_generated/api";

type Props = {
  token: string;
};

export function FocusModeToggle({ token }: Props) {
  const settings = useQuery(api.settings.getMySettings, { token });
  const setFocusMode = useMutation(api.settings.setFocusMode);

  const isOn = useMemo(() => Boolean(settings?.focusMode), [settings?.focusMode]);

  return (
    <button
      type="button"
      onClick={() => setFocusMode({ token, focusMode: !isOn })}
      className={
        "rounded-xl border px-3 py-2 text-xs font-semibold shadow-sm backdrop-blur transition " +
        (isOn
          ? "border-cyan-400/20 bg-cyan-500/10 text-cyan-100 hover:bg-cyan-500/15"
          : "border-white/10 bg-white/5 text-slate-100 hover:bg-white/10")
      }
    >
      Focus Mode: {isOn ? "On" : "Off"}
    </button>
  );
}
