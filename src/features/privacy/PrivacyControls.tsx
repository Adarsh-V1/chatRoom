"use client";

import React from "react";

type Props = {
  isOn: boolean;
  onToggle: () => void;
};

function LockIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={filled ? "text-indigo-200" : "text-slate-200"}
    >
      <path
        d="M7 11V8a5 5 0 0 1 10 0v3"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M6 11h12a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
        fill={filled ? "currentColor" : "none"}
        opacity={filled ? 0.25 : 1}
      />
    </svg>
  );
}

export function PrivacyToggleButton({ isOn, onToggle }: Props) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={
        "inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold shadow-sm backdrop-blur transition " +
        (isOn
          ? "border-indigo-400/20 bg-indigo-500/20 text-indigo-100 hover:bg-indigo-500/25"
          : "border-white/10 bg-white/5 text-slate-100 hover:bg-white/10")
      }
      title={isOn ? "Privacy mode on" : "Privacy mode off"}
    >
      <LockIcon filled={isOn} />
      Privacy
    </button>
  );
}

export function PrivacyBlurOverlay({ visible }: { visible: boolean }) {
  if (!visible) return null;

  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center rounded-2xl border border-white/10 bg-slate-950/50 backdrop-blur-sm">
      <div className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm font-semibold text-slate-100 shadow">
        Privacy mode
      </div>
    </div>
  );
}
