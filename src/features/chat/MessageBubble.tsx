"use client";

import React from "react";
import { motion } from "framer-motion";

import { Avatar } from "@/src/features/ui/Avatar";

export type ChatMessage = {
  _id: string;
  _creationTime?: number;
  userId?: string | null;
  username?: string;
  message: string;
  kind?: "text" | "file";
  fileUrl?: string | null;
  fileName?: string | null;
  profilePictureUrl?: string | null;
  contextType?: "file" | "snippet" | "task";
  contextData?: string;
  deletedAt?: number | null;
  deletedBy?: string | null;
};

type Props = {
  msg: ChatMessage;
  isMe: boolean;
  isRevealed?: boolean;
  onReveal?: (id: string) => void;
  onDelete?: (id: string) => void;
};

function formatTime(ts?: number) {
  if (!ts) return "";
  const date = new Date(ts);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function MessageBubble({ msg, isMe, isRevealed, onReveal, onDelete }: Props) {
  const name = msg.username ?? "anonymous";
  const isDeleted = Boolean(msg.deletedAt);
  const showContent = !isDeleted || Boolean(isRevealed);
  const timeLabel = formatTime(msg._creationTime);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.18 }}
      className={"flex items-end gap-2 " + (isMe ? "justify-end" : "justify-start")}
    >
      {isMe ? null : <Avatar name={name} url={msg.profilePictureUrl} size="md" />}

      <div
        className={
          "max-w-[78%] rounded-2xl border px-4 py-2 shadow-sm " +
          (isMe
            ? "border-indigo-400/20 bg-indigo-500/20 text-white"
            : "theme-panel-strong theme-text")
        }
      >
        <div className="mb-1 flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <div className="truncate text-sm font-semibold theme-muted">{name}</div>
            {msg.kind === "file" ? (
              <div className="rounded-full border px-2 py-0.5 text-[11px] font-semibold theme-chip">
                FILE
              </div>
            ) : null}
          </div>
          {timeLabel ? (
            <div className="shrink-0 text-[11px] font-semibold theme-faint">
              {timeLabel}
            </div>
          ) : null}
        </div>

        {msg.contextType && msg.contextData && showContent ? (
          <div className="mb-2 inline-flex max-w-full items-center gap-2 rounded-xl border px-3 py-2 text-[11px] font-semibold theme-chip">
            <span className="theme-faint">[{msg.contextType}:</span>
            <span className="max-w-[16rem] truncate">{msg.contextData}</span>
            <span className="theme-faint">]</span>
          </div>
        ) : null}

        {showContent ? (
          msg.message ? <div className="wrap-break-word text-base">{msg.message}</div> : null
        ) : (
          <button
            type="button"
            onClick={(e) => {
              if (e.ctrlKey || e.metaKey) {
                onReveal?.(msg._id);
              }
            }}
            className="text-left text-xs font-semibold theme-faint"
            title="Hold Ctrl/Cmd and click to reveal"
          >
            Message deleted
          </button>
        )}

        {msg.fileUrl && showContent ? (
          <a
            href={msg.fileUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-2 inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold theme-chip"
          >
            <span className="truncate max-w-[16rem]">{msg.fileName ?? "Open file"}</span>
            <span className="theme-faint">↗</span>
          </a>
        ) : null}

        {isMe && !isDeleted ? (
          <div className="mt-2 flex justify-end">
            <button
              type="button"
              onClick={() => onDelete?.(msg._id)}
              className="rounded-lg border px-2 py-1 text-[10px] font-semibold theme-chip"
            >
              Delete
            </button>
          </div>
        ) : null}
      </div>

      {isMe ? <Avatar name={name} url={msg.profilePictureUrl} size="md" /> : null}
    </motion.div>
  );
}
