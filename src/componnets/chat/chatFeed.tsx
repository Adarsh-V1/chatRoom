"use client";

import React from "react";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Doc } from "@/convex/_generated/dataModel";


interface ChatFeedProps {
  currentUser?: string;
  room: string;
}

const ChatFeed = ({ currentUser, room }: ChatFeedProps) => {
  const feed = useQuery(api.chats.getChats, { room });

  return (
    <div className="mt-1 flex h-[60vh] w-full flex-col overflow-y-auto rounded-2xl border border-white/10 bg-slate-950/30 p-4 shadow">
      {feed && feed.length > 0 ? (
        feed.map((chat: Doc<"chats">) => {
          const isMe = currentUser === chat.username;
          return (
            <div
              className={"mb-2 flex items-start " + (isMe ? "justify-end" : "justify-start")}
              key={chat._id}
            >
              <div
                className={
                  "max-w-[85%] rounded-2xl border border-white/10 px-4 py-2 shadow-sm " +
                  (isMe
                    ? "bg-indigo-500/20 text-slate-50"
                    : "bg-white/5 text-slate-100")
                }
              >
                <div className="flex items-baseline justify-between gap-4">
                  <span className="text-xs font-semibold tracking-wide text-slate-300">
                    {chat.username}
                  </span>
                  {typeof chat._creationTime === "number" ? (
                    <span className="text-[10px] text-slate-400">
                      {new Date(chat._creationTime).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  ) : null}
                </div>
                <div className="mt-1 whitespace-pre-wrap wrap-break-word text-sm leading-relaxed">
                  {chat.message}
                </div>
              </div>
            </div>
          );
        })
      ) : (
        <div className="my-auto text-center text-sm text-slate-300">
          No messages yet.
        </div>
      )}
    </div>
  );
}

export { ChatFeed }