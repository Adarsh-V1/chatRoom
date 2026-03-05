"use client";

import React from "react";
import { Film, Files, MessageSquareText, PhoneCall } from "lucide-react";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import { Card } from "@/src/components/ui/card";
import { Avatar } from "@/src/features/ui/Avatar";

type Props = {
  title: string;
  subtitle?: string;
  avatarUrl?: string | null;
  onChat?: () => void;
  onVideoCall?: () => void;
};

const attachmentItems = [
  { label: "PDF", icon: Files },
  { label: "Video", icon: Film },
  { label: "Audio", icon: Files },
  { label: "Images", icon: Files },
];

export function ChatDetailsPanel({ title, subtitle, avatarUrl, onChat, onVideoCall }: Props) {
  return (
    <Card className="flex h-full min-h-[32rem] w-full flex-col p-4">
      <div className="flex flex-col items-center rounded-[28px] border border-[color:var(--border-1)] bg-[color:rgba(216,228,243,0.84)] px-4 py-6 text-center">
        <Avatar name={title} url={avatarUrl} size="lg" className="h-20 w-20 rounded-[28px]" />
        <div className="mt-4 text-lg font-semibold tracking-tight text-[color:var(--text-1)]">{title}</div>
        {subtitle ? <div className="mt-1 text-sm text-[color:var(--text-3)]">{subtitle}</div> : null}
        <Badge variant="outline" className="mt-3">Room summary</Badge>
      </div>

      <div className="mt-4 grid w-full grid-cols-2 gap-2">
        <Button variant="secondary" onClick={onChat} className="w-full">
          <MessageSquareText className="h-4 w-4" aria-hidden="true" />
          Chat
        </Button>
        <Button variant="outline" onClick={onVideoCall} className="w-full">
          <PhoneCall className="h-4 w-4" aria-hidden="true" />
          Video call
        </Button>
      </div>

      <div className="mt-6 flex-1">
        <div className="text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--accent-text)]">Attachments</div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {attachmentItems.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.label} className="rounded-[22px] border border-[color:var(--border-1)] bg-[color:rgba(237,243,251,0.82)] px-3 py-3 shadow-sm">
                <div className="flex items-center gap-2 text-sm font-medium text-[color:var(--text-2)]">
                  <Icon className="h-4 w-4 text-cyan-700" aria-hidden="true" />
                  <span>{item.label}</span>
                </div>
              </div>
            );
          })}
        </div>
        <Button variant="outline" className="mt-3 w-full">
          View all
        </Button>
      </div>
    </Card>
  );
}
