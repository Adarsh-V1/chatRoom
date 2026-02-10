"use client";

import React, { useEffect, useRef } from "react";
import { AnimatePresence } from "framer-motion";
import { useQuery } from "convex/react";

import { api } from "@/convex/_generated/api";
import { MessageBubble, type ChatMessage } from "@/src/componnets/chat/MessageBubble";

interface ChatFeedProps {
  currentUser: string;
  room: string;
}

const ChatFeed = ({ currentUser, room }: ChatFeedProps) => {
  const feed = useQuery(api.chats.getChats, { room });
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [feed?.length, room]);

  return (
    <div className="min-h-0 flex-1 overflow-y-auto rounded-2xl border border-white/10 bg-slate-950/30 p-3 shadow-inner">
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
        <div className="flex h-full items-center justify-center text-sm text-slate-300">
          No messages yet.
        </div>
      )}
    </div>
  );
};

export { ChatFeed };