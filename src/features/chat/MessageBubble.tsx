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
  fileType?: string | null;
  fileSize?: number | null;
  profilePictureUrl?: string | null;
  contextType?: "file" | "snippet" | "task";
  contextData?: string;
  deletedAt?: number | null;
  deletedBy?: string | null;
};

type Props = {
  msg: ChatMessage;
  isMe: boolean;
  density?: "comfortable" | "compact";
  fontScale?: number;
  reducedMotion?: boolean;
  autoPlayGifs?: boolean;
  autoDownloadFiles?: boolean;
  isRevealed?: boolean;
  onReveal?: (id: string) => void;
  onDelete?: (id: string) => void;
};

function formatTime(ts?: number) {
  if (!ts) return "";
  const date = new Date(ts);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function MessageBubble({
  msg,
  isMe,
  density = "comfortable",
  fontScale = 1,
  reducedMotion = false,
  autoPlayGifs = true,
  autoDownloadFiles = false,
  isRevealed,
  onReveal,
  onDelete,
}: Props) {
  const name = msg.username ?? "anonymous";
  const isDeleted = Boolean(msg.deletedAt);
  const showContent = !isDeleted || Boolean(isRevealed);
  const timeLabel = formatTime(msg._creationTime);
  const bubblePadding = density === "compact" ? "px-3 py-1.5" : "px-4 py-2";
  const messageStyle = { fontSize: `${fontScale}rem` };
  const metaStyle = { fontSize: `${Math.max(0.75, 0.85 * fontScale)}rem` };

  const autoDownloadRef = React.useRef<HTMLAnchorElement | null>(null);
  const autoDownloadedRef = React.useRef(false);

  React.useEffect(() => {
    if (!autoDownloadFiles) return;
    if (!msg.fileUrl) return;
    if (isMe) return;
    if (autoDownloadedRef.current) return;
    autoDownloadedRef.current = true;
    autoDownloadRef.current?.click();
  }, [autoDownloadFiles, msg.fileUrl, isMe]);

  return (
    <motion.div
      layout
      initial={reducedMotion ? false : { opacity: 0, y: 10 }}
      animate={reducedMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
      exit={reducedMotion ? undefined : { opacity: 0, y: -8 }}
      transition={{ duration: reducedMotion ? 0 : 0.18 }}
      className={"flex items-end gap-2 " + (isMe ? "justify-end" : "justify-start")}
    >
      {isMe ? null : <Avatar name={name} url={msg.profilePictureUrl} size="md" />}

      <div
        className={
          "max-w-[78%] rounded-2xl border shadow-sm " +
          bubblePadding +
          " " +
          (isMe
            ? "border-indigo-400/20 bg-indigo-500/20 text-white"
            : "theme-panel-strong theme-text")
        }
      >
        <div className="mb-1 flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <div className="truncate font-semibold theme-muted" style={metaStyle}>
              {name}
            </div>
            {msg.kind === "file" ? (
              <div className="rounded-full border px-2 py-0.5 font-semibold theme-chip" style={metaStyle}>
                FILE
              </div>
            ) : null}
          </div>
          {timeLabel ? (
            <div className="shrink-0 font-semibold theme-faint" style={metaStyle}>
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
          msg.message ? (
            <div className="wrap-break-word" style={messageStyle}>
              {msg.message}
            </div>
          ) : null
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
          autoPlayGifs && msg.fileType === "image/gif" ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={msg.fileUrl}
              alt={msg.fileName ?? "Attachment"}
              className="mt-2 max-h-64 w-full rounded-xl border object-cover"
            />
          ) : (
          <a
            href={msg.fileUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-2 inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold theme-chip"
            download={autoDownloadFiles ? msg.fileName ?? true : undefined}
            ref={autoDownloadFiles ? autoDownloadRef : undefined}
          >
            <span className="truncate max-w-[16rem]">{msg.fileName ?? "Open file"}</span>
            <span className="theme-faint">↗</span>
          </a>
          )
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
