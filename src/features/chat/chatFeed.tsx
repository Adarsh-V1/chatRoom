"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { useMutation, usePaginatedQuery, useQuery } from "convex/react";
import { BellRing } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Badge } from "@/src/components/ui/badge";
import { Skeleton } from "@/src/components/ui/skeleton";
import { MessageBubble, type ChatMessage } from "@/src/features/chat/MessageBubble";
import { AwaySummaryCard } from "@/src/features/awaySummary/AwaySummaryCard";

interface ChatFeedProps {
  currentUser: string;
  room: string;
  token: string;
}

function ChatFeedSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: 5 }).map((_, index) => {
        const isMe = index % 2 === 1;
        return (
          <div key={index} className={`flex items-end gap-3 ${isMe ? "justify-end" : "justify-start"}`}>
            {!isMe ? <Skeleton className="h-10 w-10 rounded-[16px]" /> : null}
            <div className="max-w-[min(82%,44rem)] rounded-[24px] border border-[color:var(--border-1)] bg-[color:var(--message-other-bg)] px-4 py-3">
              <div className="mb-3 flex items-center justify-between gap-3">
                <Skeleton className="h-3 w-24 rounded-full" />
                <Skeleton className="h-3 w-14 rounded-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-3 w-52 rounded-full" />
                <Skeleton className="h-3 w-44 rounded-full" />
              </div>
            </div>
            {isMe ? <Skeleton className="h-10 w-10 rounded-[16px]" /> : null}
          </div>
        );
      })}
    </div>
  );
}

const ChatFeed = ({ currentUser, room, token }: ChatFeedProps) => {
  const { results: pagedFeed, status: pageStatus, isLoading: isFeedLoading, loadMore } = usePaginatedQuery(
    api.chats.getChatsPage,
    token ? { room, token } : "skip",
    { initialNumItems: 70 }
  );
  const feed = useMemo(() => [...pagedFeed].reverse(), [pagedFeed]);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const settings = useQuery(api.settings.getMySettings, token ? { token } : "skip");
  const typingUsers = useQuery(api.typing.getTypingUsers, token ? { token, room } : "skip");
  const latestSummary = useQuery(api.unread.getLatestSummary, token ? { token, room } : "skip");
  const unreadInfo = useQuery(api.unread.getUnreadInfo, token ? { token, room } : "skip");
  const mutedUsers = useQuery(api.users.getMutedUsers, token ? { token } : "skip");
  const markReadMutation = useMutation(api.unread.markRead);
  const dismissSummaryMutation = useMutation(api.unread.dismissSummary);
  const softDeleteChat = useMutation(api.chats.softDeleteChat);

  const [hasHandledAway, setHasHandledAway] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [stickToBottom, setStickToBottom] = useState(true);
  const [revealedIds, setRevealedIds] = useState<Set<string>>(() => new Set());
  const lastCountRef = useRef<number>(0);
  const previousFeedLengthRef = useRef(0);
  const previousRoomRef = useRef(room);
  const lastNotifiedIdRef = useRef<string | null>(null);
  const soundPlayedRef = useRef(0);

  const messageDensity = settings?.messageDensity ?? "comfortable";
  const fontScale = settings?.fontScale ?? 1;
  const reducedMotion = settings?.reducedMotion ?? false;
  const readReceipts = settings?.readReceipts ?? true;
  const typingIndicator = settings?.typingIndicator ?? true;
  const notificationSound = settings?.notificationSound ?? true;
  const autoPlayGifs = settings?.autoPlayGifs ?? true;
  const autoDownloadFiles = settings?.autoDownloadFiles ?? false;

  const mutedSet = useMemo(() => new Set((mutedUsers ?? []).map((name) => name.toLowerCase())), [mutedUsers]);

  const visibleTypingUsers = useMemo(() => {
    if (!typingUsers) return typingUsers;
    if (mutedSet.size === 0) return typingUsers;
    return typingUsers.filter((user) => !mutedSet.has(user.name.toLowerCase()));
  }, [typingUsers, mutedSet]);

  const shouldAutoSummarize = useMemo(() => {
    if (!token || !room || !unreadInfo || !latestSummary) return false;
    return unreadInfo.unreadCount > 0;
  }, [token, room, unreadInfo, latestSummary]);

  const filteredFeed = useMemo(() => {
    if (!feed) return feed;
    if (mutedSet.size === 0) return feed;
    return feed.filter((chat) => !mutedSet.has((chat.username ?? "").trim().toLowerCase()));
  }, [feed, mutedSet]);

  useEffect(() => {
    const container = scrollRef.current;
    const currentLength = filteredFeed?.length ?? 0;
    const roomChanged = previousRoomRef.current !== room;
    const shouldSnap = reducedMotion || roomChanged || previousFeedLengthRef.current === 0;

    if (container && currentLength > 0 && stickToBottom) {
      const frame = window.requestAnimationFrame(() => {
        container.scrollTo({
          top: container.scrollHeight,
          behavior: shouldSnap ? "auto" : "smooth",
        });
      });

      previousFeedLengthRef.current = currentLength;
      previousRoomRef.current = room;
      return () => window.cancelAnimationFrame(frame);
    }

    previousFeedLengthRef.current = currentLength;
    previousRoomRef.current = room;
  }, [filteredFeed?.length, room, stickToBottom, reducedMotion]);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    const onScroll = () => {
      const threshold = 48;
      const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
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
    const count = filteredFeed?.length ?? 0;
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

    const last = filteredFeed?.[count - 1] as { _id?: string; username?: string; message?: string } | undefined;
    if (!last || (last.username ?? "") === currentUser) {
      setStickToBottom(true);
      lastCountRef.current = count;
      return;
    }

    if (notificationSound && Date.now() - soundPlayedRef.current > 1000) {
      soundPlayedRef.current = Date.now();
      try {
        const AudioCtor = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (AudioCtor) {
          const ctx = new AudioCtor();
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "sine";
          osc.frequency.value = 880;
          gain.gain.value = 0.04;
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start();
          osc.stop(ctx.currentTime + 0.08);
        }
      } catch {
        // Ignore audio errors.
      }
    }

    if (document.hidden && last._id && lastNotifiedIdRef.current !== last._id) {
      lastNotifiedIdRef.current = last._id;
    }

    const summaryText = last.message ? `${last.username ?? "Someone"}: ${last.message}` : "New message";
    toast.message(summaryText, {
      id: "new-message-toast",
      duration: 2800,
      icon: <BellRing className="h-4 w-4" aria-hidden="true" />,
    });
    lastCountRef.current = count;
  }, [filteredFeed, currentUser, notificationSound]);

  const handleReveal = useCallback((id: string) => {
    setRevealedIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  }, []);

  const handleDelete = useCallback(
    async (id: string) => {
      if (!token) return;
      try {
        await softDeleteChat({ token, chatId: id as Id<"chats"> });
        toast.success("Message deleted");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to delete message");
      }
    },
    [token, softDeleteChat]
  );

  useEffect(() => {
    if (!filteredFeed || filteredFeed.length === 0) return;
    const last = filteredFeed[filteredFeed.length - 1] as { username?: string };
    if ((last.username ?? "") === currentUser) {
      setStickToBottom(true);
    }
  }, [filteredFeed, currentUser]);

  useEffect(() => {
    if (!token || !room || !unreadInfo || hasHandledAway) return;

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
    if (!token || !hasHandledAway || !readReceipts || !filteredFeed || filteredFeed.length === 0) return;
    const last = filteredFeed[filteredFeed.length - 1] as { _creationTime?: number };
    const lastCreationTime = typeof last?._creationTime === "number" ? last._creationTime : null;
    if (lastCreationTime === null) return;
    void markReadMutation({ token, room, lastReadCreationTime: lastCreationTime });
  }, [token, room, filteredFeed, hasHandledAway, markReadMutation, readReceipts]);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden">
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
        className="app-scroll min-h-0 flex-1 overflow-y-auto rounded-[30px] border border-[color:var(--border-1)] bg-[color:var(--surface-2)] p-3 shadow-inner shadow-cyan-950/6 backdrop-blur-sm sm:p-4"
      >
        {pageStatus === "CanLoadMore" || pageStatus === "LoadingMore" ? (
          <div className="mb-3 flex justify-center">
            <button
              type="button"
              onClick={() => loadMore(60)}
              disabled={pageStatus === "LoadingMore"}
              className="rounded-full border border-[color:var(--border-1)] bg-[color:rgba(244,248,253,0.95)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--text-2)] transition hover:border-[color:var(--border-2)] hover:text-[color:var(--text-1)] disabled:opacity-60"
            >
              {pageStatus === "LoadingMore" ? "Loading older..." : "Load older messages"}
            </button>
          </div>
        ) : null}

        {isFeedLoading && (!filteredFeed || filteredFeed.length === 0) ? (
          <ChatFeedSkeleton />
        ) : filteredFeed && filteredFeed.length > 0 ? (
          <div className={messageDensity === "compact" ? "flex flex-col gap-2" : "flex flex-col gap-3"}>
            <AnimatePresence initial={false}>
              {filteredFeed.map((chat) => {
                const msg = chat as unknown as ChatMessage;
                const isMe = (msg.username ?? "") === currentUser;
                return (
                  <MessageBubble
                    key={msg._id}
                    msg={msg}
                    isMe={isMe}
                    density={messageDensity}
                    fontScale={fontScale}
                    reducedMotion={reducedMotion}
                    autoPlayGifs={autoPlayGifs}
                    autoDownloadFiles={autoDownloadFiles}
                    isRevealed={revealedIds.has(msg._id)}
                    onReveal={handleReveal}
                    onDelete={(id) => {
                      void handleDelete(id);
                    }}
                  />
                );
              })}
            </AnimatePresence>

            {typingIndicator && visibleTypingUsers && visibleTypingUsers.length > 0 ? (
              <div className="px-2 pt-2 text-sm text-[color:var(--text-3)]">
                <Badge variant="outline" className="normal-case tracking-normal text-xs font-medium">
                  {visibleTypingUsers.length === 1
                    ? `${visibleTypingUsers[0].name} is typing...`
                    : `${visibleTypingUsers.map((user) => user.name).join(", ")} are typing...`}
                </Badge>
              </div>
            ) : null}
          </div>
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-3 rounded-[26px] border border-dashed border-[color:var(--border-1)] bg-[color:var(--muted-surface)] px-6 py-10 text-center text-sm text-[color:var(--text-3)]">
            <div className="text-base font-medium text-[color:var(--text-2)]">
              {isFeedLoading ? "Loading messages..." : "No messages yet"}
            </div>
            <div>
              {isFeedLoading
                ? "Syncing this room in real time."
                : "Start the thread with a quick update, file, or question."}
            </div>
            {typingIndicator && visibleTypingUsers && visibleTypingUsers.length > 0 ? (
              <Badge variant="outline" className="normal-case tracking-normal text-xs font-medium">
                {visibleTypingUsers.length === 1
                  ? `${visibleTypingUsers[0].name} is typing...`
                  : `${visibleTypingUsers.map((user) => user.name).join(", ")} are typing...`}
              </Badge>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
};

export { ChatFeed };
