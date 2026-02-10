"use client";

import React, { useState } from "react";

type Props = {
  onLeave: () => Promise<void> | void;
  onToggleMic: () => Promise<void> | void;
  onToggleCam: () => Promise<void> | void;
  onFlipCam: () => Promise<void> | void;
  onToggleShare: () => Promise<void> | void;
  onTogglePip: () => void;
  onToggleBlur: () => void;
  onReconnect: () => void;
  onToggleRecord: () => void;
  onToggleChat: () => void;
  onToggleAutoGain: () => void;
  onToggleMuteOnJoin: () => void;
  micEnabled: boolean;
  camEnabled: boolean;
  canFlipCam: boolean;
  isFlipping: boolean;
  isSharing: boolean;
  pipEnabled: boolean;
  blurEnabled: boolean;
  isRecording: boolean;
  chatOpen: boolean;
  autoGainEnabled: boolean;
  muteOnJoin: boolean;
  qualityLabel: string;
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

export function CallControls({
  onLeave,
  onToggleMic,
  onToggleCam,
  onFlipCam,
  onToggleShare,
  onTogglePip,
  onToggleBlur,
  onReconnect,
  onToggleRecord,
  onToggleChat,
  onToggleAutoGain,
  onToggleMuteOnJoin,
  micEnabled,
  camEnabled,
  canFlipCam,
  isFlipping,
  isSharing,
  pipEnabled,
  blurEnabled,
  isRecording,
  chatOpen,
  autoGainEnabled,
  muteOnJoin,
  qualityLabel,
}: Props) {
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
    "call-control-btn inline-flex items-center justify-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold focus:outline-none focus:ring-2 active:scale-[0.98] sm:px-4 sm:py-3 sm:text-base";

  return (
    <div className="call-controls-shell mx-auto w-full max-w-2xl rounded-2xl border p-2 shadow backdrop-blur">
      <div className="flex flex-wrap items-center justify-center gap-2">
        <div className="call-control-pill rounded-xl border px-3 py-2 text-xs font-semibold">
          {qualityLabel}
        </div>
        <button
          type="button"
          onClick={toggleMic}
          aria-pressed={micEnabled}
          className={baseBtn}
        >
          <IconMic muted={!micEnabled} />
          {micEnabled ? "Mic" : "Muted"}
        </button>

        <button
          type="button"
          onClick={toggleCam}
          aria-pressed={camEnabled}
          className={baseBtn}
        >
          <IconCam off={!camEnabled} />
          {camEnabled ? "Camera" : "Camera off"}
        </button>

        <button
          type="button"
          onClick={onFlipCam}
          disabled={!canFlipCam || isFlipping}
          className={baseBtn + " disabled:cursor-not-allowed disabled:opacity-60"}
        >
          {isFlipping ? "Switching" : "Flip"}
        </button>

        <button
          type="button"
          onClick={onToggleShare}
          className={baseBtn}
        >
          {isSharing ? "Stop share" : "Share"}
        </button>

        <button
          type="button"
          onClick={onToggleRecord}
          className={baseBtn}
        >
          {isRecording ? "Stop rec" : "Record"}
        </button>

        <button
          type="button"
          onClick={onToggleChat}
          className={baseBtn}
        >
          {chatOpen ? "Hide chat" : "Chat"}
        </button>

        <button
          type="button"
          onClick={onTogglePip}
          className={baseBtn}
        >
          {pipEnabled ? "PiP on" : "PiP off"}
        </button>

        <button
          type="button"
          onClick={onToggleBlur}
          className={baseBtn}
        >
          {blurEnabled ? "Blur on" : "Blur off"}
        </button>

        <button
          type="button"
          onClick={onToggleAutoGain}
          className={baseBtn}
        >
          {autoGainEnabled ? "AGC on" : "AGC off"}
        </button>

        <button
          type="button"
          onClick={onToggleMuteOnJoin}
          className={baseBtn}
        >
          {muteOnJoin ? "Mute join" : "Live join"}
        </button>

        <button
          type="button"
          onClick={onReconnect}
          className={baseBtn}
        >
          Reconnect
        </button>

        <button
          type="button"
          onClick={leave}
          className={baseBtn + " call-control-danger focus:ring-red-400/40"}
        >
          Leave
        </button>
      </div>
    </div>
  );
}
