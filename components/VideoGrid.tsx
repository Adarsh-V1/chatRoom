"use client";

import React, { useEffect, useRef } from "react";

type Props = {
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  localLabel?: string;
  remoteLabel?: string;
};

export function VideoGrid({ localStream, remoteStream, localLabel, remoteLabel }: Props) {
  const localRef = useRef<HTMLVideoElement | null>(null);
  const remoteRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (localRef.current) {
      localRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteRef.current) {
      remoteRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  return (
    <div className="grid h-full w-full gap-3 sm:grid-cols-2">
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
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm text-slate-300">
            Starting camera…
          </div>
        )}
      </div>

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
      </div>
    </div>
  );
}
