"use client";

import { useQuery } from "convex/react";

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

  const typingUsers = useQuery(
    api.typing.getTypingUsers,
    normalizedPeer && room ? { token, room } : "skip"
  );

  const isPeerTyping = Boolean(
    normalizedPeer &&
      typingUsers?.some(
        (user) => user.name.toLowerCase() === normalizedPeer.toLowerCase()
      )
  );

  const statusLabel = normalizedPeer
    ? isPeerTyping
      ? "Typing..."
      : peerStatus?.[0]?.online
        ? "Online"
        : `Last seen ${formatLastSeen(peerStatus?.[0]?.lastSeenAt)}`
    : null;

  if (!me) return null;

  return (
    <div className="mt-1 flex items-center gap-3">
      <Avatar name={me.name} url={me.profilePictureUrl} size="md" className="rounded-xl" />
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <div className="truncate text-lg font-bold theme-text">{me.name}</div>
          {statusLabel ? (
            <div className="rounded-full border px-2 py-0.5 text-[10px] font-semibold theme-badge">
              {statusLabel}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
