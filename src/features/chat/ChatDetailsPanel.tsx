"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useQuery } from "convex/react";
import { Activity, Film, Files, MessageSquareText, PhoneCall, Sparkles } from "lucide-react";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import { Card } from "@/src/components/ui/card";
import { api } from "@/convex/_generated/api";
import { Avatar } from "@/src/features/ui/Avatar";

type Props = {
  title: string;
  subtitle?: string;
  avatarUrl?: string | null;
  onChat?: () => void;
  onVideoCall?: () => void;
  token?: string;
  peerName?: string | null;
  room?: string;
};

const attachmentItems = [
  { label: "Shared PDFs", icon: Files },
  { label: "Media clips", icon: Film },
  { label: "Context drops", icon: Sparkles },
  { label: "Thread notes", icon: MessageSquareText },
];

export function ChatDetailsPanel({ title, subtitle, avatarUrl, onChat, onVideoCall, token, peerName, room }: Props) {
  const normalizedPeer = peerName?.trim() ?? "";
  const [nowMs, setNowMs] = useState(() => Date.now());
  const peerProfile = useQuery(api.users.getUserProfile, token && normalizedPeer ? { token, name: normalizedPeer } : "skip");
  const peerStatus = useQuery(api.presence.getUserStatuses, token && normalizedPeer ? { token, names: [normalizedPeer] } : "skip");
  const typingUsers = useQuery(api.typing.getTypingUsers, token && normalizedPeer && room ? { token, room } : "skip");

  useEffect(() => {
    const intervalId = window.setInterval(() => setNowMs(Date.now()), 30_000);
    return () => window.clearInterval(intervalId);
  }, []);

  const peerState = useMemo(() => {
    const status = peerStatus?.[0];
    const isTyping = Boolean(typingUsers?.some((user) => user.name.toLowerCase() === normalizedPeer.toLowerCase()));
    if (isTyping) return "Typing now";
    if (status?.online) return "Online";
    if (status?.lastSeenAt) {
      const mins = Math.max(1, Math.floor((nowMs - status.lastSeenAt) / 60000));
      if (mins < 60) return `Last seen ${mins}m ago`;
      const hours = Math.floor(mins / 60);
      if (hours < 24) return `Last seen ${hours}h ago`;
      return `Last seen ${Math.floor(hours / 24)}d ago`;
    }
    return subtitle ?? "Room overview";
  }, [normalizedPeer, nowMs, peerStatus, subtitle, typingUsers]);

  const resolvedAvatarUrl = peerProfile?.profilePictureUrl ?? avatarUrl;

  const infoPills = [
    { label: "Conversation", value: normalizedPeer ? "Direct thread" : "Shared room", icon: Activity },
    { label: "Status", value: peerState, icon: Sparkles },
    { label: "Actions", value: "Swipe right on mobile", icon: PhoneCall },
  ];

  return (
    <Card className="flex h-full min-h-[32rem] w-full flex-col overflow-hidden p-4">
      <div className="rounded-[28px] border border-[color:var(--border-1)] bg-[color:var(--surface-4)] px-4 py-6 text-center">
        <div className="mx-auto w-fit rounded-[30px] border border-[color:var(--brand-border)] bg-[color:var(--surface-2)] p-1.5 shadow-[var(--shadow-soft)]">
          <Avatar name={normalizedPeer || title} url={resolvedAvatarUrl} size="lg" className="h-20 w-20 rounded-[26px]" />
        </div>
        <div className="mt-4 text-lg font-semibold tracking-tight text-[color:var(--text-1)]">{normalizedPeer || title}</div>
        <div className="mt-1 text-sm text-[color:var(--text-3)]">{peerState}</div>
        <Badge variant="outline" className="mt-3">
          {normalizedPeer ? "Peer profile" : "Room summary"}
        </Badge>
      </div>

      <div className="mt-4 grid w-full grid-cols-2 gap-2">
        <Button variant="secondary" onClick={onChat} className="w-full">
          <MessageSquareText className="h-4 w-4" aria-hidden="true" />
          Chat
        </Button>
        <Button variant="outline" onClick={onVideoCall} className="w-full">
          <PhoneCall className="h-4 w-4" aria-hidden="true" />
          Video call
        </Button>
      </div>

      <div className="mt-6 grid gap-2">
        {infoPills.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className="rounded-[22px] border border-[color:var(--border-1)] bg-[color:var(--surface-2)] px-3 py-3 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-sm font-medium text-[color:var(--text-2)]">
                  <Icon className="h-4 w-4 text-[color:var(--accent-text)]" aria-hidden="true" />
                  <span>{item.label}</span>
                </div>
                <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--text-3)]">{item.value}</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 flex-1">
        <div className="text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--accent-text)]">Workspace snapshot</div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {attachmentItems.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.label} className="rounded-[22px] border border-[color:var(--border-1)] bg-[color:var(--surface-2)] px-3 py-3 shadow-sm transition-transform duration-200 hover:-translate-y-0.5">
                <div className="flex items-center gap-2 text-sm font-medium text-[color:var(--text-2)]">
                  <Icon className="h-4 w-4 text-[color:var(--accent-text)]" aria-hidden="true" />
                  <span>{item.label}</span>
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-3 rounded-[22px] border border-[color:var(--border-1)] bg-[color:var(--muted-surface)] px-4 py-3 text-sm leading-6 text-[color:var(--text-2)]">
          {normalizedPeer
            ? `This panel keeps quick context for ${normalizedPeer} visible on smaller screens without leaving the thread.`
            : "Use this panel to keep room context visible while messages continue in the main feed."}
        </div>
      </div>
    </Card>
  );
}
