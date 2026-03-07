"use client";

import { useQuery } from "convex/react";
import { Badge } from "@/src/components/ui/badge";
import { Skeleton } from "@/src/components/ui/skeleton";
import { api } from "@/convex/_generated/api";
import { Avatar } from "@/src/features/ui/Avatar";

type Props = {
  token: string;
  room?: string;
  peerName?: string | null;
};

const formatLastSeen = (ts: number | null | undefined) => {
  if (!ts) return "unknown";
  const diffMs = Date.now() - ts;
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

export function OnlineAs({ token, room, peerName }: Props) {
  const me = useQuery(api.users.getMe, { token });
  const normalizedPeer = peerName?.trim() ?? "";
  const peerStatus = useQuery(
    api.presence.getUserStatuses,
    normalizedPeer ? { token, names: [normalizedPeer] } : "skip"
  );

  const typingUsers = useQuery(api.typing.getTypingUsers, normalizedPeer && room ? { token, room } : "skip");

  const isPeerTyping = Boolean(
    normalizedPeer && typingUsers?.some((user) => user.name.toLowerCase() === normalizedPeer.toLowerCase())
  );

  const statusLabel = normalizedPeer
    ? isPeerTyping
      ? "Typing"
      : peerStatus?.[0]?.online
        ? "Online"
        : `Last seen ${formatLastSeen(peerStatus?.[0]?.lastSeenAt)}`
    : null;

  if (!me) {
    return (
      <div className="mt-1 flex items-center gap-3">
        <Skeleton className="h-12 w-12 rounded-[18px]" />
        <div className="min-w-0 flex-1 space-y-2">
          <Skeleton className="h-4 w-28 rounded-full" />
          <Skeleton className="h-3 w-44 rounded-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="mt-1 flex items-center gap-3">
      <Avatar name={me.name} url={me.profilePictureUrl} size="lg" />
        <div className="min-w-0">
          <div className="truncate text-lg font-semibold tracking-tight text-[color:var(--text-1)]">{me.name}</div>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <span className="text-sm text-[color:var(--text-3)]">Signed in and ready</span>
            {statusLabel ? <Badge variant={statusLabel === "Online" || statusLabel === "Typing" ? "success" : "outline"}>{statusLabel}</Badge> : null}
          </div>
        </div>
      </div>
  );
}
