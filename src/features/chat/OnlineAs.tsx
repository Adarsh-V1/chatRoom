"use client";

import React from "react";
import { useQuery } from "convex/react";

import { api } from "@/convex/_generated/api";
import { Avatar } from "@/src/features/ui/Avatar";

type Props = {
  token: string;
};

export function OnlineAs({ token }: Props) {
  const me = useQuery(api.users.getMe, { token });
  const settings = useQuery(api.settings.getMySettings, { token });

  if (!me) return null;

  return (
    <div className="mt-1 flex items-center gap-3">
      <Avatar name={me.name} url={me.profilePictureUrl} size="md" className="rounded-xl" />
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <div className="truncate text-lg font-bold theme-text">{me.name}</div>
          {settings?.focusMode ? (
            <div className="rounded-full border px-2 py-0.5 text-[10px] font-semibold theme-badge">
              In Focus Mode
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
