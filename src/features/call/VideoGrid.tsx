"use client";

import React, { useEffect, useRef } from "react";

type Props = {
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  localLabel?: string;
  remoteLabel?: string;
  pipMode?: boolean;
  blurLocal?: boolean;
  onRemoteVideoReady?: (el: HTMLVideoElement | null) => void;
};

export function VideoGrid({
  localStream,
  remoteStream,
  localLabel,
  remoteLabel,
  pipMode,
  blurLocal,
  onRemoteVideoReady,
}: Props) {
  const localRef = useRef<HTMLVideoElement | null>(null);
  const remoteRef = useRef<HTMLVideoElement | null>(null);
  const hasRemote = Boolean(remoteStream);

  useEffect(() => {
    if (localRef.current) {
      localRef.current.srcObject = localStream;
      const playPromise = localRef.current.play();
      if (playPromise && typeof playPromise.catch === "function") {
        playPromise.catch(() => undefined);
      }
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteRef.current) {
      remoteRef.current.srcObject = remoteStream;
      const playPromise = remoteRef.current.play();
      if (playPromise && typeof playPromise.catch === "function") {
        playPromise.catch(() => undefined);
      }
    }
    onRemoteVideoReady?.(remoteRef.current);
  }, [remoteStream]);

  const gridClasses =
    "grid h-full w-full gap-3 " +
    (hasRemote && !pipMode
      ? "grid-rows-2 sm:grid-rows-1 sm:grid-cols-2"
      : "grid-rows-1");

  return (
    <div className={gridClasses}>
      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-slate-950/60">
        <div className="absolute left-3 top-3 z-10 rounded-full border border-white/10 bg-slate-950/70 px-3 py-1.5 text-xs font-semibold text-slate-50">
          {remoteLabel ?? "Peer"}
        </div>
        {remoteStream ? (
          <video ref={remoteRef} autoPlay playsInline className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm text-slate-300">
            Waiting for the other person…
          </div>
        )}

        {hasRemote && pipMode ? (
          <div className="absolute bottom-3 right-3 h-28 w-20 overflow-hidden rounded-xl border border-white/10 bg-slate-950/80 shadow-lg sm:h-36 sm:w-28">
            <div className="absolute left-2 top-2 z-10 rounded-full border border-white/10 bg-slate-950/70 px-2 py-1 text-[10px] font-semibold text-slate-50">
              {localLabel ?? "You"}
            </div>
            {localStream ? (
              <video
                ref={localRef}
                autoPlay
                muted
                playsInline
                className={
                  "h-full w-full object-cover " +
                  (blurLocal ? "blur-sm" : "")
                }
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-[11px] text-slate-300">
                Starting…
              </div>
            )}
          </div>
        ) : null}
      </div>

      {!hasRemote || !pipMode ? (
        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-slate-950/60">
          <div className="absolute left-3 top-3 z-10 rounded-full border border-white/10 bg-slate-950/70 px-3 py-1.5 text-xs font-semibold text-slate-50">
            {localLabel ?? "You"}
          </div>
          {localStream ? (
            <video
              ref={localRef}
              autoPlay
              muted
              playsInline
              className={
                "h-full w-full object-cover " +
                (blurLocal ? "blur-sm" : "")
              }
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-sm text-slate-300">
              Starting camera…
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
