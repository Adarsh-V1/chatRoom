"use client";

import type { ReactNode } from "react";
import { X } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { cn } from "@/src/lib/utils";

type ChatMobileSheetProps = {
  open: boolean;
  onClose: () => void;
  side: "left" | "right";
  children: ReactNode;
};

export function ChatMobileSheet({ open, onClose, side, children }: ChatMobileSheetProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex bg-slate-950/30 backdrop-blur-sm lg:hidden">
      <button type="button" className="absolute inset-0" aria-label="Close panel" onClick={onClose} />
      <div
        className={cn(
          "relative h-full w-[88vw] max-w-sm p-3",
          side === "left" ? "animate-[slideIn_0.2s_ease-out]" : "ml-auto animate-[slideInRight_0.2s_ease-out]"
        )}
      >
        <div className="absolute right-6 top-6 z-10">
          <Button variant="secondary" size="icon" onClick={onClose} aria-label="Close panel">
            <X className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
        {children}
      </div>
    </div>
  );
}
