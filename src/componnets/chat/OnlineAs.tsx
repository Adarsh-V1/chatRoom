"use client";

import React from "react";
import { useQuery } from "convex/react";

import { api } from "@/convex/_generated/api";
import { Avatar } from "@/src/componnets/ui/Avatar";

type Props = {
  token: string;
};

export function OnlineAs({ token }: Props) {
  const me = useQuery(api.users.getMe, { token });

  if (!me) return null;

  return (
    <div className="mt-1 flex items-center gap-3">
      <Avatar name={me.name} url={me.profilePictureUrl} size="md" className="rounded-xl" />
      <div className="min-w-0">
        <div className="truncate text-lg font-bold text-white">{me.name}</div>
      </div>
    </div>
  );
}
