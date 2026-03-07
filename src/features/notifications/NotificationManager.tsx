"use client";

import { useMemo, useState } from "react";
import { BellRing, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/src/components/ui/button";
import { useChatAuth } from "@/src/features/auth/useChatAuth";
import { cn } from "@/src/lib/utils";
import { usePushNotifications } from "./usePushNotifications";

const PROMPT_DISMISS_KEY = "convolink:notifications-prompt-dismissed-until";
const PROMPT_DISMISS_MS = 7 * 24 * 60 * 60 * 1000;

export function NotificationManager() {
  const auth = useChatAuth();
  const { isReady, isSupported, isConfigured, isEnabled, isBusy, permission, enableNotifications } =
    usePushNotifications({ syncWhenEnabled: true });
  const [dismissedUntil, setDismissedUntil] = useState(() => {
    if (typeof window === "undefined") return 0;
    const rawValue = window.localStorage.getItem(PROMPT_DISMISS_KEY);
    const parsed = rawValue ? Number(rawValue) : 0;
    if (!Number.isFinite(parsed)) return 0;
    return parsed > Date.now() ? parsed : 0;
  });

  const dismissPrompt = () => {
    if (typeof window !== "undefined") {
      const next = Date.now() + PROMPT_DISMISS_MS;
      window.localStorage.setItem(PROMPT_DISMISS_KEY, String(next));
      setDismissedUntil(next);
    }
  };

  const shouldShowPrompt = useMemo(() => {
    if (!isReady || !auth.isLoggedIn || !isSupported || !isConfigured || isEnabled || permission !== "default") {
      return false;
    }

    return dismissedUntil === 0;
  }, [auth.isLoggedIn, dismissedUntil, isConfigured, isEnabled, isReady, isSupported, permission]);

  if (!shouldShowPrompt) {
    return null;
  }

  return (
    <aside className="pointer-events-none fixed inset-x-3 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-50 md:inset-x-auto md:right-4 md:top-24 md:bottom-auto">
      <div
        className={cn(
          "pointer-events-auto w-full max-w-sm rounded-[30px] border border-[color:var(--border-2)]",
          "bg-[color:rgba(242,247,253,0.96)] p-4 shadow-[0_28px_80px_-34px_rgba(8,15,35,0.42)] backdrop-blur-2xl"
        )}
      >
        <div className="flex items-start gap-3">
          <div className="mt-1 rounded-2xl bg-cyan-100 p-2 text-cyan-800">
            <BellRing className="h-5 w-5" aria-hidden="true" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold text-[color:var(--text-1)]">
              Enable notifications to never miss a message
            </div>
            <p className="mt-1 text-sm leading-6 text-[color:var(--text-2)]">
              We can still alert you when someone sends a message, even after the website is closed.
            </p>
          </div>
          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full" onClick={dismissPrompt} aria-label="Dismiss notification prompt">
            <X className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <Button
            size="sm"
            disabled={isBusy}
            onClick={() => {
              void enableNotifications()
                .then(() => {
                  dismissPrompt();
                  toast.success("Notifications enabled");
                })
                .catch((error) => {
                  toast.error(error instanceof Error ? error.message : "Could not enable notifications");
                });
            }}
          >
            {isBusy ? "Enabling..." : "Enable notifications"}
          </Button>
          <Button variant="outline" size="sm" onClick={dismissPrompt}>
            Not now
          </Button>
        </div>
      </div>
    </aside>
  );
}
