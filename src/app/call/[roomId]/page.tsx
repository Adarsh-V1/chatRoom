"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { useParams, useRouter } from "next/navigation";

import { api } from "@/convex/_generated/api";
import { CallControls } from "@/components/CallControls";
import { VideoGrid } from "@/components/VideoGrid";
import { useChatAuth } from "@/src/componnets/auth/useChatAuth";

export default function CallRoomPage() {
  const params = useParams();
  const rawRoomId = params?.roomId;
  const roomId = Array.isArray(rawRoomId)
    ? rawRoomId[0] ?? ""
    : (rawRoomId ?? "").toString();
  const router = useRouter();
  const auth = useChatAuth();

  const call = useQuery(api.calls.getCallByRoomId, roomId ? { roomId } : "skip");
  const endCall = useMutation(api.calls.endCall);
  const startCall = useMutation(api.calls.startCall);
  const sendSignal = useMutation(api.webrtc.sendSignal);

  const [error, setError] = useState<string | null>(null);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [autoStartError, setAutoStartError] = useState<string | null>(null);
  const [isAutoStarting, setIsAutoStarting] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [micEnabled, setMicEnabled] = useState(true);
  const [camEnabled, setCamEnabled] = useState(true);

  const peerRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const pendingIceRef = useRef<RTCIceCandidateInit[]>([]);
  const processedSignalsRef = useRef<Set<string>>(new Set());
  const sentOfferRef = useRef(false);

  const isStarter = useMemo(() => {
    const me = (auth.name ?? "").trim().toLowerCase();
    const starter = (call?.startedByName ?? "").trim().toLowerCase();
    return Boolean(me && starter && me === starter);
  }, [auth.name, call?.startedByName]);

  const signals = useQuery(
    api.webrtc.listSignals,
    auth.isLoggedIn && roomId ? { token: auth.token ?? "", roomId } : "skip"
  );

  const stopStream = (stream?: MediaStream | null) => {
    stream?.getTracks().forEach((track) => track.stop());
  };

  const flushPendingIce = useCallback(async () => {
    const pc = peerRef.current;
    if (!pc || !pc.remoteDescription) return;
    const pending = pendingIceRef.current;
    pendingIceRef.current = [];
    for (const candidate of pending) {
      try {
        await pc.addIceCandidate(candidate);
      } catch {
        // Ignore invalid candidates during reconnects.
      }
    }
  }, []);

  const handleSignal = useCallback(
    async (signal: { _id: string; type: string; payload: string }) => {
      const pc = peerRef.current;
      if (!pc) return;
      if (!auth.token || !roomId) return;

      let payload: RTCSessionDescriptionInit | RTCIceCandidateInit;
      try {
        payload = JSON.parse(signal.payload) as RTCSessionDescriptionInit | RTCIceCandidateInit;
      } catch {
        return;
      }

      if (signal.type === "offer") {
        if (pc.signalingState !== "stable") return;
        await pc.setRemoteDescription(payload as RTCSessionDescriptionInit);
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        await sendSignal({
          token: auth.token,
          roomId,
          type: "answer",
          payload: JSON.stringify(answer),
        });
        await flushPendingIce();
        return;
      }

      if (signal.type === "answer") {
        if (pc.signalingState !== "have-local-offer") return;
        await pc.setRemoteDescription(payload as RTCSessionDescriptionInit);
        await flushPendingIce();
        return;
      }

      if (signal.type === "ice") {
        const candidate = payload as RTCIceCandidateInit;
        if (pc.remoteDescription) {
          await pc.addIceCandidate(candidate);
        } else {
          pendingIceRef.current.push(candidate);
        }
      }
    },
    [auth.token, roomId, sendSignal, flushPendingIce]
  );

  useEffect(() => {
    const stream = localStream;
    if (!stream) return;
    setMicEnabled(stream.getAudioTracks().some((track) => track.enabled));
    setCamEnabled(stream.getVideoTracks().some((track) => track.enabled));
  }, [localStream]);

  useEffect(() => {
    if (!signals || signals.length === 0) return;
    for (const signal of signals) {
      const id = signal._id.toString();
      if (processedSignalsRef.current.has(id)) continue;
      processedSignalsRef.current.add(id);
      void handleSignal(signal);
    }
  }, [signals, handleSignal]);

  useEffect(() => {
    if (!auth.isReady || !auth.token || !auth.name) return;
    if (!roomId) return;
    if (call === undefined) return;
    if (call === null || call.status === "ended") return;

    let cancelled = false;
    setError(null);
    setMediaError(null);
    setIsConnecting(true);
    processedSignalsRef.current = new Set();
    pendingIceRef.current = [];
    sentOfferRef.current = false;

    const setup = async () => {
      const pc = new RTCPeerConnection({
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
      });
      peerRef.current = pc;

      const inboundStream = new MediaStream();

      pc.ontrack = (event) => {
        if (event.streams && event.streams[0]) {
          setRemoteStream(event.streams[0]);
        } else {
          inboundStream.addTrack(event.track);
          setRemoteStream(inboundStream);
        }
      };

      pc.onicecandidate = (event) => {
        if (!event.candidate) return;
        void sendSignal({
          token: auth.token!,
          roomId,
          type: "ice",
          payload: JSON.stringify(event.candidate),
        });
      };

      pc.onconnectionstatechange = () => {
        if (pc.connectionState === "connected") {
          setIsConnecting(false);
        }
        if (pc.connectionState === "failed") {
          setError("Connection failed. Try rejoining.");
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
      if (cancelled) {
        stopStream(stream);
        return;
      }
      localStreamRef.current = stream;
      setLocalStream(stream);
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));
      setIsConnecting(false);
    };

    setup().catch((err) => {
      if (cancelled) return;
      const message = err instanceof Error ? err.message : "Failed to access camera/microphone";
      setMediaError(message);
      setIsConnecting(false);
    });

    return () => {
      cancelled = true;
      const pc = peerRef.current;
      peerRef.current = null;
      if (pc) pc.close();
      stopStream(localStreamRef.current);
      localStreamRef.current = null;
      setLocalStream(null);
      setRemoteStream(null);
    };
  }, [auth.isReady, auth.token, auth.name, roomId, call, sendSignal]);

  useEffect(() => {
    if (!auth.token || !roomId) return;
    if (!isStarter) return;
    if (!peerRef.current || !localStreamRef.current) return;
    if (sentOfferRef.current) return;
    if (peerRef.current.signalingState !== "stable") return;

    const run = async () => {
      try {
        const pc = peerRef.current;
        if (!pc) return;
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        sentOfferRef.current = true;
        await sendSignal({
          token: auth.token,
          roomId,
          type: "offer",
          payload: JSON.stringify(offer),
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to start call");
      }
    };

    void run();
  }, [auth.token, roomId, isStarter, sendSignal]);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      if (roomId) return;
      if (!auth.isReady) return;
      if (!auth.isLoggedIn || !auth.token) return;
      if (isAutoStarting) return;

      setIsAutoStarting(true);
      setAutoStartError(null);

      try {
        const result = await startCall({ token: auth.token, conversationId: "general" });
        if (cancelled) return;
        router.replace(`/call/${result.roomId}`);
      } catch (e) {
        if (cancelled) return;
        setAutoStartError(e instanceof Error ? e.message : "Failed to start call");
        setIsAutoStarting(false);
      }
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, [roomId, auth.isReady, auth.isLoggedIn, auth.token, isAutoStarting, router, startCall]);

  if (!roomId) {
    return (
      <main className="min-h-screen w-full bg-slate-950 p-4 sm:p-6">
        <div className="mx-auto flex min-h-[calc(100vh-2rem)] w-full max-w-md items-center justify-center">
          <div className="w-full rounded-2xl border border-white/10 bg-slate-950/50 p-8 shadow backdrop-blur">
            {autoStartError ? (
              <>
                <div className="text-base font-semibold text-slate-100">Could not start call</div>
                <p className="mt-2 text-sm text-slate-300">{autoStartError}</p>
              </>
            ) : auth.isReady && auth.isLoggedIn ? (
              <>
                <div className="text-base font-semibold text-slate-100">
                  Starting a call in general…
                </div>
                <p className="mt-2 text-sm text-slate-300">Hang tight while we create the room.</p>
              </>
            ) : (
              <>
                <div className="text-base font-semibold text-slate-100">Missing room id</div>
                <p className="mt-2 text-sm text-slate-300">
                  Return to chat and start the call again.
                </p>
              </>
            )}
            <button
              type="button"
              onClick={() => router.push("/chat")}
              className="mt-5 w-full rounded-xl bg-indigo-500 px-4 py-3 text-base font-semibold text-white shadow hover:bg-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/70 active:scale-[0.98]"
            >
              Back to chat
            </button>
          </div>
        </div>
      </main>
    );
  }

  if (!auth.isReady) {
    return (
      <main className="min-h-screen w-full bg-slate-950 p-4 sm:p-6">
        <div className="mx-auto flex min-h-[calc(100vh-2rem)] w-full max-w-md items-center justify-center">
          <div className="w-full rounded-2xl border border-white/10 bg-slate-950/50 p-8 shadow backdrop-blur">
            <div className="text-base font-semibold text-slate-100">Checking session…</div>
          </div>
        </div>
      </main>
    );
  }

  if (!auth.isLoggedIn) {
    return (
      <main className="min-h-screen w-full bg-slate-950 p-4 sm:p-6">
        <div className="mx-auto flex min-h-[calc(100vh-2rem)] w-full max-w-md items-center justify-center">
          <div className="w-full rounded-2xl border border-white/10 bg-slate-950/50 p-8 shadow backdrop-blur">
            <div className="text-base font-semibold text-slate-100">Sign in required</div>
            <p className="mt-2 text-sm text-slate-300">
              Open the chat first to sign in, then rejoin.
            </p>
            <button
              type="button"
              onClick={() => router.push("/chat")}
              className="mt-5 w-full rounded-xl bg-indigo-500 px-4 py-3 text-base font-semibold text-white shadow hover:bg-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/70 active:scale-[0.98]"
            >
              Go to chat
            </button>
          </div>
        </div>
      </main>
    );
  }

  if (call === null) {
    return (
      <main className="min-h-screen w-full bg-slate-950 p-4 sm:p-6">
        <div className="mx-auto flex min-h-[calc(100vh-2rem)] w-full max-w-md items-center justify-center">
          <div className="w-full rounded-2xl border border-white/10 bg-slate-950/50 p-8 shadow backdrop-blur">
            <div className="text-base font-semibold text-slate-100">Call not found</div>
            <p className="mt-2 text-sm text-slate-300">This room id is not active.</p>
            <button
              type="button"
              onClick={() => router.push("/chat")}
              className="mt-5 w-full rounded-xl bg-indigo-500 px-4 py-3 text-base font-semibold text-white shadow hover:bg-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/70 active:scale-[0.98]"
            >
              Back to chat
            </button>
          </div>
        </div>
      </main>
    );
  }

  if (call && call.status === "ended") {
    return (
      <main className="min-h-screen w-full bg-slate-950 p-4 sm:p-6">
        <div className="mx-auto flex min-h-[calc(100vh-2rem)] w-full max-w-md items-center justify-center">
          <div className="w-full rounded-2xl border border-white/10 bg-slate-950/50 p-8 shadow backdrop-blur">
            <div className="text-base font-semibold text-slate-100">Call ended</div>
            <p className="mt-2 text-sm text-slate-300">This call is no longer active.</p>
            <button
              type="button"
              onClick={() => router.push("/chat")}
              className="mt-5 w-full rounded-xl bg-indigo-500 px-4 py-3 text-base font-semibold text-white shadow hover:bg-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/70 active:scale-[0.98]"
            >
              Back to chat
            </button>
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen w-full bg-slate-950 p-4 sm:p-6">
        <div className="mx-auto flex min-h-[calc(100vh-2rem)] w-full max-w-md items-center justify-center">
          <div className="w-full rounded-2xl border border-white/10 bg-slate-950/50 p-8 shadow backdrop-blur">
            <div className="text-base font-semibold text-slate-100">Could not join call</div>
            <p className="mt-2 text-sm text-slate-300">{error}</p>
            <button
              type="button"
              onClick={() => router.push("/chat")}
              className="mt-5 w-full rounded-xl bg-indigo-500 px-4 py-3 text-base font-semibold text-white shadow hover:bg-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/70 active:scale-[0.98]"
            >
              Back to chat
            </button>
          </div>
        </div>
      </main>
    );
  }

  if (mediaError) {
    return (
      <main className="min-h-screen w-full bg-slate-950 p-4 sm:p-6">
        <div className="mx-auto flex min-h-[calc(100vh-2rem)] w-full max-w-md items-center justify-center">
          <div className="w-full rounded-2xl border border-white/10 bg-slate-950/50 p-8 shadow backdrop-blur">
            <div className="text-base font-semibold text-slate-100">
              Camera or microphone blocked
            </div>
            <p className="mt-2 text-sm text-slate-300">{mediaError}</p>
            <button
              type="button"
              onClick={() => router.push("/chat")}
              className="mt-5 w-full rounded-xl bg-indigo-500 px-4 py-3 text-base font-semibold text-white shadow hover:bg-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/70 active:scale-[0.98]"
            >
              Back to chat
            </button>
          </div>
        </div>
      </main>
    );
  }

  if (!localStream || isConnecting) {
    return (
      <main className="min-h-screen w-full bg-slate-950 p-4 sm:p-6">
        <div className="mx-auto flex min-h-[calc(100vh-2rem)] w-full max-w-md items-center justify-center">
          <div className="w-full rounded-2xl border border-white/10 bg-slate-950/50 p-8 shadow backdrop-blur">
            <div className="text-base font-semibold text-slate-100">Connecting…</div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen w-full bg-slate-950 p-3 sm:p-6">
      <div className="mx-auto flex h-[calc(100vh-1.5rem)] w-full max-w-6xl flex-col gap-3 sm:h-[calc(100vh-3rem)] sm:gap-4">
        <div className="flex-1 overflow-hidden rounded-2xl border border-white/10 bg-slate-950/50 p-2 sm:p-3 shadow backdrop-blur">
          <div className="flex h-full flex-col">
            <header className="flex items-center justify-between gap-3 px-1 pb-2">
              <div className="min-w-0">
                <div className="text-xs font-semibold tracking-widest text-slate-300/80">IN CALL</div>
                <div className="truncate text-base font-semibold text-slate-100">Room: {roomId}</div>
              </div>
              <button
                type="button"
                onClick={() => router.push("/chat")}
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-100 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-cyan-400/40 active:scale-[0.98]"
              >
                Back
              </button>
            </header>

            <div className="min-h-0 flex-1">
              <VideoGrid
                localStream={localStream}
                remoteStream={remoteStream}
                localLabel={auth.name ?? "You"}
                remoteLabel="Peer"
              />
            </div>

            <div className="sticky bottom-0 pt-3 pb-1">
              <CallControls
                micEnabled={micEnabled}
                camEnabled={camEnabled}
                onToggleMic={() => {
                  const stream = localStreamRef.current;
                  const track = stream?.getAudioTracks()[0];
                  if (!track) return;
                  const next = !track.enabled;
                  track.enabled = next;
                  setMicEnabled(next);
                }}
                onToggleCam={() => {
                  const stream = localStreamRef.current;
                  const track = stream?.getVideoTracks()[0];
                  if (!track) return;
                  const next = !track.enabled;
                  track.enabled = next;
                  setCamEnabled(next);
                }}
                onLeave={async () => {
                  if (isStarter) {
                    try {
                      await endCall({ token: auth.token!, roomId });
                    } catch {
                      // Ignore: leaving still navigates away.
                    }
                  }
                  router.push("/chat");
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
