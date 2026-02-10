"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { useMutation, useQuery } from "convex/react";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { MessageBubble, type ChatMessage } from "@/src/features/chat/MessageBubble";
import { AwaySummaryCard } from "@/src/features/awaySummary/AwaySummaryCard";

interface ChatFeedProps {
  currentUser: string;
  room: string;
  token: string;
  isPriority?: boolean;
}

const ChatFeed = ({ currentUser, room, token, isPriority }: ChatFeedProps) => {
  const feed = useQuery(api.chats.getChats, { room });
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const settings = useQuery(api.settings.getMySettings, token ? { token } : "skip");
  const focusMode = Boolean(settings?.focusMode);

  const latestSummary = useQuery(
    api.unread.getLatestSummary,
    token ? { token, room } : "skip"
  );

  const typingUsers = useQuery(
    api.typing.getTypingUsers,
    token ? { token, room } : "skip"
  );

  const unreadInfo = useQuery(api.unread.getUnreadInfo, token ? { token, room } : "skip");
  const markReadMutation = useMutation(api.unread.markRead);
  const dismissSummaryMutation = useMutation(api.unread.dismissSummary);
  const softDeleteChat = useMutation(api.chats.softDeleteChat);

  const [hasHandledAway, setHasHandledAway] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [stickToBottom, setStickToBottom] = useState(true);
  const [revealedIds, setRevealedIds] = useState<Set<string>>(() => new Set());
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastCountRef = useRef<number>(0);

  const shouldAutoSummarize = useMemo(() => {
    if (!token) return false;
    if (!room) return false;
    if (!unreadInfo) return false;
    if (unreadInfo.unreadCount <= 0) return false;
    if (latestSummary) return false;
    if (focusMode && !isPriority) return false;
    return true;
  }, [token, room, unreadInfo, latestSummary, focusMode, isPriority]);

  useEffect(() => {
    if (!stickToBottom) return;
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [feed?.length, room, stickToBottom]);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    const onScroll = () => {
      const threshold = 48;
      const distanceFromBottom =
        container.scrollHeight - container.scrollTop - container.clientHeight;
      setStickToBottom(distanceFromBottom < threshold);
    };

    container.addEventListener("scroll", onScroll);
    return () => container.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setHasHandledAway(false);
    setIsSummarizing(false);
    setRevealedIds(new Set());
    setStickToBottom(true);
  }, [room]);

  useEffect(() => {
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, []);

  useEffect(() => {
    const count = feed?.length ?? 0;
    if (count === 0) {
      lastCountRef.current = 0;
      return;
    }

    if (lastCountRef.current === 0) {
      lastCountRef.current = count;
      return;
    }

    if (count <= lastCountRef.current) {
      lastCountRef.current = count;
      return;
    }

    const last = feed?.[count - 1] as unknown as { username?: string; message?: string };
    if (!last || (last.username ?? "") === currentUser) {
      setStickToBottom(true);
      lastCountRef.current = count;
      return;
    }

    const label = last.message ? `${last.username ?? "Someone"}: ${last.message}` : "New message";
    setToast(label);

    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2800);
    lastCountRef.current = count;
  }, [feed, currentUser]);

  useEffect(() => {
    if (!feed || feed.length === 0) return;
    const last = feed[feed.length - 1] as unknown as { username?: string };
    if ((last.username ?? "") === currentUser) {
      setStickToBottom(true);
    }
  }, [feed, currentUser]);

  useEffect(() => {
    if (!token) return;
    if (!room) return;
    if (!unreadInfo) return;
    if (hasHandledAway) return;

    if (!shouldAutoSummarize) {
      setHasHandledAway(true);
      return;
    }

    setIsSummarizing(true);
    void (async () => {
      try {
        await fetch("/api/away-summary", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token, room, limit: 200 }),
        });
      } finally {
        setIsSummarizing(false);
        setHasHandledAway(true);
      }
    })();
  }, [token, room, unreadInfo, hasHandledAway, shouldAutoSummarize]);

  useEffect(() => {
    if (!token) return;
    if (!hasHandledAway) return;
    if (!feed || feed.length === 0) return;
    const last = feed[feed.length - 1] as unknown as { _creationTime?: number };
    const lastCreationTime = typeof last?._creationTime === "number" ? last._creationTime : null;
    if (lastCreationTime === null) return;
    void markReadMutation({ token, room, lastReadCreationTime: lastCreationTime });
  }, [token, room, feed, hasHandledAway, markReadMutation]);

  return (
    <div className="min-h-0 flex-1">
      {latestSummary ? (
        <AwaySummaryCard
          bullets={latestSummary.bullets}
          isLoading={isSummarizing}
          onDismiss={() => {
            void dismissSummaryMutation({ token, summaryId: latestSummary._id });
          }}
        />
      ) : isSummarizing ? (
        <AwaySummaryCard bullets={[]} isLoading onDismiss={() => setIsSummarizing(false)} />
      ) : null}

      <div
        ref={scrollRef}
        className="min-h-0 h-full overflow-y-auto rounded-2xl border theme-panel-strong p-3 shadow-inner"
      >
        {toast ? (
          <div className="sticky top-2 z-10 mx-auto w-full max-w-md rounded-full border px-4 py-2 text-xs font-semibold shadow backdrop-blur theme-chip">
            {toast}
          </div>
        ) : null}
        {feed && feed.length > 0 ? (
          <div className="mt-2 flex flex-col gap-2">
            <AnimatePresence initial={false}>
              {feed.map((chat) => {
                const msg = chat as unknown as ChatMessage;
                const isMe = (msg.username ?? "") === currentUser;
                return (
                  <MessageBubble
                    key={msg._id}
                    msg={msg}
                    isMe={isMe}
                    isRevealed={revealedIds.has(msg._id)}
                    onReveal={(id) => {
                      setRevealedIds((prev) => {
                        const next = new Set(prev);
                        next.add(id);
                        return next;
                      });
                    }}
                    onDelete={(id) => {
                      if (!token) return;
                      void softDeleteChat({ token, chatId: id as Id<"chats"> });
                    }}
                  />
                );
              })}
            </AnimatePresence>
            {typingUsers && typingUsers.length > 0 ? (
              <div className="px-2 text-sm font-semibold theme-faint">
                {typingUsers.length === 1
                  ? `${typingUsers[0].name} is typing…`
                  : `${typingUsers.map((u) => u.name).join(", ")} are typing…`}
              </div>
            ) : null}
            <div ref={bottomRef} />
          </div>
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-sm theme-faint">
            <div>No messages yet.</div>
            {typingUsers && typingUsers.length > 0 ? (
              <div className="text-sm font-semibold theme-faint">
                {typingUsers.length === 1
                  ? `${typingUsers[0].name} is typing…`
                  : `${typingUsers.map((u) => u.name).join(", ")} are typing…`}
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
};

export { ChatFeed };