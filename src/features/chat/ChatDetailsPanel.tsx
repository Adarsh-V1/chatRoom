"use client";

import React from "react";

import { Avatar } from "@/src/features/ui/Avatar";

type Props = {
  title: string;
  subtitle?: string;
  avatarUrl?: string | null;
  onChat?: () => void;
  onVideoCall?: () => void;
};

const attachmentItems = [
  { label: "PDF", icon: "PDF" },
  { label: "Video", icon: "VIDEO" },
  { label: "MP3", icon: "MP3" },
  { label: "Image", icon: "IMAGE" },
];

export function ChatDetailsPanel({ title, subtitle, avatarUrl, onChat, onVideoCall }: Props) {
  return (
    <aside className="flex p-2 max-h-[90vh] min-h-[60vh] w-full flex-col rounded-2xl border theme-panel p-4 shadow backdrop-blur lg:h-[calc(100vh-3rem)]">
      <div className="flex flex-col items-center text-center">
        <Avatar name={title} url={avatarUrl} size="lg" className="h-20 w-20 rounded-3xl" />
        <div className="mt-3 text-base font-semibold theme-text">{title}</div>
        {subtitle ? <div className="mt-1 text-xs theme-muted">{subtitle}</div> : null}
      </div>

      <div className="mt-5 grid w-full grid-cols-2 gap-2">
        <button
          type="button"
          onClick={onChat}
          className="rounded-xl border px-3 py-2 text-xs font-semibold shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-400/40 active:scale-[0.98] theme-chip"
        >
          Chat
        </button>
        <button
          type="button"
          onClick={onVideoCall}
          className="rounded-xl border px-3 py-2 text-xs font-semibold shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-400/40 active:scale-[0.98] theme-chip"
        >
          Video Call
        </button>
      </div>

      <div className="mt-6">
        <div className="text-xs font-semibold tracking-widest theme-faint">ATTACHMENTS</div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {attachmentItems.map((item) => (
            <div
              key={item.label}
              className="flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold theme-chip"
            >
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg border text-[10px] font-bold theme-panel-strong">
                {item.icon}
              </span>
              <span>{item.label}</span>
            </div>
          ))}
        </div>
        <button
          type="button"
          className="mt-3 w-full rounded-xl border px-3 py-2 text-xs font-semibold theme-chip"
        >
          View All
        </button>
      </div>
    </aside>
  );
}
