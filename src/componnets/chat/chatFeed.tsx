"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { useMutation, useQuery } from "convex/react";

import { api } from "@/convex/_generated/api";
import { MessageBubble, type ChatMessage } from "@/src/componnets/chat/MessageBubble";
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

  const settings = useQuery(api.settings.getMySettings, token ? { token } : "skip");
  const focusMode = Boolean(settings?.focusMode);

  const latestSummary = useQuery(
    api.unread.getLatestSummary,
    token ? { token, room } : "skip"
  );

  const unreadInfo = useQuery(api.unread.getUnreadInfo, token ? { token, room } : "skip");
  const markReadMutation = useMutation(api.unread.markRead);
  const dismissSummaryMutation = useMutation(api.unread.dismissSummary);

  const [hasHandledAway, setHasHandledAway] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);

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
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [feed?.length, room]);

  useEffect(() => {
    setHasHandledAway(false);
    setIsSummarizing(false);
  }, [room]);

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

      <div className="min-h-0 h-full overflow-y-auto rounded-2xl border theme-panel-strong p-3 shadow-inner">
        {feed && feed.length > 0 ? (
          <div className="flex flex-col gap-2">
            <AnimatePresence initial={false}>
              {feed.map((chat) => {
                const msg = chat as unknown as ChatMessage;
                const isMe = (msg.username ?? "") === currentUser;
                return <MessageBubble key={msg._id} msg={msg} isMe={isMe} />;
              })}
            </AnimatePresence>
            <div ref={bottomRef} />
          </div>
        ) : (
          <div className="flex h-full items-center justify-center text-sm theme-faint">
            No messages yet.
          </div>
        )}
      </div>
    </div>
  );
};

export { ChatFeed };