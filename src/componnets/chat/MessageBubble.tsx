"use client";

import React from "react";
import { motion } from "framer-motion";

import { Avatar } from "@/src/componnets/ui/Avatar";

export type ChatMessage = {
  _id: string;
  username?: string;
  message: string;
  kind?: "text" | "file";
  fileUrl?: string | null;
  fileName?: string | null;
  profilePictureUrl?: string | null;
  contextType?: "file" | "snippet" | "task";
  contextData?: string;
};

type Props = {
  msg: ChatMessage;
  isMe: boolean;
};

export function MessageBubble({ msg, isMe }: Props) {
  const name = msg.username ?? "anonymous";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.18 }}
      className={"flex items-end gap-2 " + (isMe ? "justify-end" : "justify-start")}
    >
      {isMe ? null : <Avatar name={name} url={msg.profilePictureUrl} size="sm" />}

      <div
        className={
          "max-w-[78%] rounded-2xl border px-4 py-2 shadow-sm " +
          (isMe
            ? "border-indigo-400/20 bg-indigo-500/20 text-white"
            : "theme-panel-strong theme-text")
        }
      >
        <div className="mb-0.5 flex items-center gap-2">
          <div className="truncate text-xs font-semibold theme-muted">{name}</div>
          {msg.kind === "file" ? (
            <div className="rounded-full border px-2 py-0.5 text-[10px] font-semibold theme-chip">
              FILE
            </div>
          ) : null}
        </div>

        {msg.contextType && msg.contextData ? (
          <div className="mb-2 inline-flex max-w-full items-center gap-2 rounded-xl border px-3 py-2 text-[11px] font-semibold theme-chip">
            <span className="theme-faint">[{msg.contextType}:</span>
            <span className="max-w-[16rem] truncate">{msg.contextData}</span>
            <span className="theme-faint">]</span>
          </div>
        ) : null}

        {msg.message ? <div className="wrap-break-word text-sm">{msg.message}</div> : null}

        {msg.fileUrl ? (
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
      </div>

      {isMe ? <Avatar name={name} url={msg.profilePictureUrl} size="sm" /> : null}
    </motion.div>
  );
}
