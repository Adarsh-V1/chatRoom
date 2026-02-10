"use client";

import React, { useState } from "react";

type Props = {
  onLeave: () => Promise<void> | void;
  onToggleMic: () => Promise<void> | void;
  onToggleCam: () => Promise<void> | void;
  micEnabled: boolean;
  camEnabled: boolean;
};

function IconMic(props: { muted: boolean }) {
  if (props.muted) {
    return (
      <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
        <path
          d="M10 9v3a2 2 0 0 0 3.41 1.41"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d="M12 16a4 4 0 0 0 4-4V8a4 4 0 0 0-7.7-1.5"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d="M6 11v1a6 6 0 0 0 11.3 3"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d="M12 18v3"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d="M8 21h8"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d="M4 4l16 16"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
      <path
        d="M12 14a3 3 0 0 0 3-3V7a3 3 0 0 0-6 0v4a3 3 0 0 0 3 3Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M19 11v1a7 7 0 0 1-14 0v-1"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M12 19v2"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M8 21h8"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconCam(props: { off: boolean }) {
  if (props.off) {
    return (
      <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
        <path
          d="M14 10.5V9a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h5"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d="M15 12l5-3v6l-2.2-1.32"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M4 4l16 16"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
      <path
        d="M6 7h8a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M16 12l5-3v6l-5-3Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function CallControls({ onLeave, onToggleMic, onToggleCam, micEnabled, camEnabled }: Props) {
  const [busy, setBusy] = useState<"mic" | "cam" | "leave" | null>(null);

  const toggleMic = async () => {
    if (busy) return;
    setBusy("mic");
    try {
      await onToggleMic();
    } finally {
      setBusy(null);
    }
  };

  const toggleCam = async () => {
    if (busy) return;
    setBusy("cam");
    try {
      await onToggleCam();
    } finally {
      setBusy(null);
    }
  };

  const leave = async () => {
    if (busy) return;
    setBusy("leave");
    try {
      await onLeave();
    } finally {
      setBusy(null);
    }
  };

  const baseBtn =
    "inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-base font-semibold focus:outline-none focus:ring-2 active:scale-[0.98]";

  return (
    <div className="mx-auto w-full max-w-2xl rounded-2xl border border-white/10 bg-slate-950/60 p-2 shadow backdrop-blur">
      <div className="flex flex-wrap items-center justify-center gap-2">
        <button
          type="button"
          onClick={toggleMic}
          aria-pressed={micEnabled}
          className={
            baseBtn +
            " border-white/10 bg-white/5 text-slate-100 hover:bg-white/10 focus:ring-cyan-400/40"
          }
        >
          <IconMic muted={!micEnabled} />
          {micEnabled ? "Mic" : "Muted"}
        </button>

        <button
          type="button"
          onClick={toggleCam}
          aria-pressed={camEnabled}
          className={
            baseBtn +
            " border-white/10 bg-white/5 text-slate-100 hover:bg-white/10 focus:ring-cyan-400/40"
          }
        >
          <IconCam off={!camEnabled} />
          {camEnabled ? "Camera" : "Camera off"}
        </button>

        <button
          type="button"
          onClick={leave}
          className={
            baseBtn +
            " border-red-500/30 bg-red-500/15 text-red-50 hover:bg-red-500/25 focus:ring-red-400/40"
          }
        >
          Leave
        </button>
      </div>
    </div>
  );
}
