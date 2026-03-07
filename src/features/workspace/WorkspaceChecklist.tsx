"use client";

import { CheckCircle2, Compass, MessageSquareText, Sparkles, UsersRound } from "lucide-react";

import { Button } from "@/src/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card";

type Props = {
  hasSuggestedContact: boolean;
  onOpenGeneral: () => void;
  onStartDirectMessage: () => void;
  onBrowseGroups: () => void;
  onTakeTour: () => void;
  onComplete: () => void;
  completing: boolean;
};

export function WorkspaceChecklist({
  hasSuggestedContact,
  onOpenGeneral,
  onStartDirectMessage,
  onBrowseGroups,
  onTakeTour,
  onComplete,
  completing,
}: Props) {
  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <div className="text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--accent-text)]">
          First-run checklist
        </div>
        <CardTitle>Set up the workspace once, then resume from where you left off.</CardTitle>
        <CardDescription>
          This replaces the old interruptive tour modal with inline next steps inside the inbox.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 lg:grid-cols-2">
        <button
          type="button"
          onClick={onOpenGeneral}
          className="rounded-[24px] border border-[color:var(--border-1)] bg-[color:var(--surface-2)] p-4 text-left transition hover:border-[color:var(--border-2)] hover:bg-[color:var(--surface-1)]"
        >
          <div className="flex items-center gap-3">
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-[color:var(--border-1)] bg-[color:var(--surface-4)]">
              <MessageSquareText className="h-4 w-4" aria-hidden="true" />
            </div>
            <div>
              <div className="text-sm font-semibold text-[color:var(--text-1)]">Open the general room</div>
              <div className="text-sm text-[color:var(--text-3)]">Start with the shared workspace conversation.</div>
            </div>
          </div>
        </button>

        <button
          type="button"
          onClick={onStartDirectMessage}
          disabled={!hasSuggestedContact}
          className="rounded-[24px] border border-[color:var(--border-1)] bg-[color:var(--surface-2)] p-4 text-left transition hover:border-[color:var(--border-2)] hover:bg-[color:var(--surface-1)] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <div className="flex items-center gap-3">
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-[color:var(--border-1)] bg-[color:var(--surface-4)]">
              <Sparkles className="h-4 w-4" aria-hidden="true" />
            </div>
            <div>
              <div className="text-sm font-semibold text-[color:var(--text-1)]">Start a direct message</div>
              <div className="text-sm text-[color:var(--text-3)]">
                Jump straight into a dedicated thread with a teammate.
              </div>
            </div>
          </div>
        </button>

        <button
          type="button"
          onClick={onBrowseGroups}
          className="rounded-[24px] border border-[color:var(--border-1)] bg-[color:var(--surface-2)] p-4 text-left transition hover:border-[color:var(--border-2)] hover:bg-[color:var(--surface-1)]"
        >
          <div className="flex items-center gap-3">
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-[color:var(--border-1)] bg-[color:var(--surface-4)]">
              <UsersRound className="h-4 w-4" aria-hidden="true" />
            </div>
            <div>
              <div className="text-sm font-semibold text-[color:var(--text-1)]">Browse groups</div>
              <div className="text-sm text-[color:var(--text-3)]">Create or join a shared team space.</div>
            </div>
          </div>
        </button>

        <button
          type="button"
          onClick={onTakeTour}
          className="rounded-[24px] border border-[color:var(--border-1)] bg-[color:var(--surface-2)] p-4 text-left transition hover:border-[color:var(--border-2)] hover:bg-[color:var(--surface-1)]"
        >
          <div className="flex items-center gap-3">
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-[color:var(--border-1)] bg-[color:var(--surface-4)]">
              <Compass className="h-4 w-4" aria-hidden="true" />
            </div>
            <div>
              <div className="text-sm font-semibold text-[color:var(--text-1)]">Take the guided tour</div>
              <div className="text-sm text-[color:var(--text-3)]">Open the existing guided walkthrough when you want it.</div>
            </div>
          </div>
        </button>

        <div className="lg:col-span-2 flex flex-wrap items-center justify-between gap-3 rounded-[24px] border border-[color:var(--success-border)] bg-[color:var(--success-soft)] p-4">
          <div>
            <div className="text-sm font-semibold text-[color:var(--success-text)]">Mark onboarding complete</div>
            <div className="text-sm text-[color:var(--text-2)]">
              Future sign-ins will resume from your last visited conversation instead of reopening the inbox.
            </div>
          </div>
          <Button onClick={onComplete} disabled={completing}>
            <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
            {completing ? "Saving..." : "Complete setup"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
