"use client";

import React from "react";

type Props = {
  bullets: string[];
  onDismiss: () => void;
  isLoading?: boolean;
};

export function AwaySummaryCard({ bullets, onDismiss, isLoading }: Props) {
  const visibleBullets = (bullets ?? []).filter(Boolean).slice(0, 12);

  return (
    <div className="mb-3 rounded-2xl border theme-panel p-3 shadow backdrop-blur">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-xs font-semibold tracking-widest theme-faint">
            WHILE YOU WERE AWAY
          </div>
          <div className="mt-1 text-sm font-semibold theme-text">
            {isLoading ? "Summarizing…" : "Catch-up"}
          </div>
        </div>
        <button
          type="button"
          onClick={onDismiss}
          className="rounded-xl border px-3 py-2 text-xs font-semibold theme-chip"
        >
          Dismiss
        </button>
      </div>

      {visibleBullets.length > 0 ? (
        <ul className="mt-3 space-y-1 text-sm theme-muted">
          {visibleBullets.map((b, idx) => (
            <li key={idx} className="flex gap-2">
              <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[color:var(--text-3)]" />
              <span className="min-w-0">{b}</span>
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-3 text-sm theme-faint">No summary available.</div>
      )}
    </div>
  );
}
