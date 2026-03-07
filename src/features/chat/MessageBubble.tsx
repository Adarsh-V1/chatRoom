"use client";

import React from "react";
import { motion } from "framer-motion";
import { Download, Paperclip, Trash2 } from "lucide-react";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import { cn } from "@/src/lib/utils";
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

function MessageBubbleBase({
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
  const messageStyle = { fontSize: `${fontScale}rem` };
  const metaStyle = { fontSize: `${Math.max(0.72, 0.82 * fontScale)}rem` };
  const compact = density === "compact";

  const autoDownloadRef = React.useRef<HTMLAnchorElement | null>(null);
  const autoDownloadedRef = React.useRef(false);

  React.useEffect(() => {
    if (!autoDownloadFiles || !msg.fileUrl || isMe || autoDownloadedRef.current) return;
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
      className={cn("flex items-end gap-3", isMe ? "justify-end" : "justify-start")}
    >
      {isMe ? null : <Avatar name={name} url={msg.profilePictureUrl} size="md" />}

      <div
        className={cn(
          "max-w-[min(82%,44rem)] rounded-[24px] border px-4 py-3 shadow-sm",
          compact && "px-3 py-2",
          isMe
            ? "border-[color:var(--brand-border)] [background-image:var(--message-me-bg)] text-[color:var(--message-me-text)]"
            : "border-[color:var(--border-1)] bg-[color:var(--message-other-bg)] text-[color:var(--message-other-text)]"
        )}
      >
        <div className="mb-2 flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <div className={cn("truncate font-semibold", isMe ? "text-[color:var(--message-me-text)] opacity-90" : "text-[color:var(--text-2)]")} style={metaStyle}>
              {name}
            </div>
            {msg.kind === "file" ? (
              <Badge variant={isMe ? "outline" : "secondary"} className={isMe ? "border-white/25 bg-white/10 text-[color:var(--message-me-text)]" : undefined}>
                Attachment
              </Badge>
            ) : null}
          </div>
          {timeLabel ? (
            <div className={cn("shrink-0 font-medium", isMe ? "text-[color:var(--message-me-text)] opacity-80" : "text-[color:var(--text-3)]")} style={metaStyle}>
              {timeLabel}
            </div>
          ) : null}
        </div>

        {msg.contextType && msg.contextData && showContent ? (
          <div className={cn("mb-3 rounded-2xl border px-3 py-2 text-xs font-medium", isMe ? "border-white/20 bg-white/10 text-[color:var(--message-me-text)] opacity-90" : "border-[color:var(--border-1)] bg-[color:var(--surface-3)] text-[color:var(--text-2)]")}>
            [{msg.contextType}: {msg.contextData}]
          </div>
        ) : null}

        {showContent ? (
          msg.message ? (
            <div className="wrap-break-word leading-6" style={messageStyle}>
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
            className={cn("text-left text-xs font-medium", isMe ? "text-sky-100/80" : "text-slate-500")}
            title="Hold Ctrl/Cmd and click to reveal"
          >
            Message deleted
          </button>
        )}

        {msg.fileUrl && showContent ? (
          autoPlayGifs && msg.fileType === "image/gif" ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={msg.fileUrl} alt={msg.fileName ?? "Attachment"} className="mt-3 max-h-72 w-full rounded-[18px] border border-black/5 object-cover" />
          ) : (
            <a
              href={msg.fileUrl}
              target="_blank"
              rel="noreferrer"
              className={cn(
                "mt-3 inline-flex items-center gap-2 rounded-2xl border px-3 py-2 text-sm font-medium",
                isMe ? "border-white/20 bg-white/10 text-[color:var(--message-me-text)]" : "border-[color:var(--border-1)] bg-[color:var(--surface-3)] text-[color:var(--text-2)]"
              )}
              download={autoDownloadFiles ? msg.fileName ?? true : undefined}
              ref={autoDownloadFiles ? autoDownloadRef : undefined}
            >
              {autoDownloadFiles ? <Download className="h-4 w-4" aria-hidden="true" /> : <Paperclip className="h-4 w-4" aria-hidden="true" />}
              <span className="max-w-[16rem] truncate">{msg.fileName ?? "Open file"}</span>
            </a>
          )
        ) : null}

        {isMe && !isDeleted ? (
          <div className="mt-3 flex justify-end">
            <Button variant="ghost" size="sm" onClick={() => onDelete?.(msg._id)} className="text-[color:var(--message-me-text)] hover:bg-white/12 hover:text-[color:var(--message-me-text)]">
              <Trash2 className="h-4 w-4" aria-hidden="true" />
              Delete
            </Button>
          </div>
        ) : null}
      </div>

      {isMe ? <Avatar name={name} url={msg.profilePictureUrl} size="md" /> : null}
    </motion.div>
  );
}

export const MessageBubble = React.memo(MessageBubbleBase);
