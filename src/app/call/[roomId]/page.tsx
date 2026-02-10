"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { useParams, useRouter } from "next/navigation";

import { api } from "@/convex/_generated/api";
import { CallControls } from "@/src/features/call/CallControls";
import { VideoGrid } from "@/src/features/call/VideoGrid";
import { useChatAuth } from "@/src/features/auth/useChatAuth";
import { ChatFeed } from "@/src/features/chat/chatFeed";
import { ChatForm } from "@/src/features/chat/chatForm";

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
  const [rtcReady, setRtcReady] = useState(false);
  const [connectionState, setConnectionState] = useState<RTCPeerConnectionState>("new");
  const [cameraFacing, setCameraFacing] = useState<"user" | "environment">("user");
  const [isFlipping, setIsFlipping] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [pipEnabled, setPipEnabled] = useState(true);
  const [blurEnabled, setBlurEnabled] = useState(false);
  const [callStartedAt, setCallStartedAt] = useState<number | null>(null);
  const [durationLabel, setDurationLabel] = useState("00:00");
  const [audioOutputs, setAudioOutputs] = useState<MediaDeviceInfo[]>([]);
  const [selectedOutputId, setSelectedOutputId] = useState<string>("");
  const [reconnectNonce, setReconnectNonce] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [autoGainEnabled, setAutoGainEnabled] = useState(true);
  const [muteOnJoin, setMuteOnJoin] = useState(true);
  const [qualityLabel, setQualityLabel] = useState("Quality: --");

  const peerRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const cameraTrackRef = useRef<MediaStreamTrack | null>(null);
  const screenTrackRef = useRef<MediaStreamTrack | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const recordChunksRef = useRef<Blob[]>([]);
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
        const startingState = pc.signalingState as RTCSignalingState;
        if (startingState !== "stable") return;
        try {
          await pc.setRemoteDescription(payload as RTCSessionDescriptionInit);
          const nextState = pc.signalingState as RTCSignalingState;
          if (nextState !== "have-remote-offer") return;
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          await sendSignal({
            token: auth.token,
            roomId,
            type: "answer",
            payload: JSON.stringify(answer),
          });
          await flushPendingIce();
        } catch (err) {
          if (err instanceof DOMException && err.name === "InvalidStateError") return;
          throw err;
        }
        return;
      }

      if (signal.type === "answer") {
        if (pc.signalingState !== "have-local-offer") return;
        try {
          await pc.setRemoteDescription(payload as RTCSessionDescriptionInit);
          await flushPendingIce();
        } catch (err) {
          if (err instanceof DOMException && err.name === "InvalidStateError") return;
          throw err;
        }
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

  const restartIce = useCallback(async () => {
    const pc = peerRef.current;
    if (!pc) return;
    if (!auth.token || !roomId) return;
    if (pc.signalingState !== "stable") return;

    try {
      const offer = await pc.createOffer({ iceRestart: true });
      await pc.setLocalDescription(offer);
      sentOfferRef.current = true;
      await sendSignal({
        token: auth.token,
        roomId,
        type: "offer",
        payload: JSON.stringify(offer),
      });
    } catch {
      // Ignore restart failures.
    }
  }, [auth.token, roomId, sendSignal]);

  useEffect(() => {
    const stream = localStream;
    if (!stream) return;
    setMicEnabled(stream.getAudioTracks().some((track) => track.enabled));
    setCamEnabled(stream.getVideoTracks().some((track) => track.enabled));
  }, [localStream]);

  useEffect(() => {
    const stream = localStreamRef.current;
    const track = stream?.getAudioTracks()[0];
    if (!track || typeof track.applyConstraints !== "function") return;

    void track
      .applyConstraints({
        autoGainControl: autoGainEnabled,
        echoCancellation: true,
        noiseSuppression: true,
      })
      .catch(() => undefined);
  }, [autoGainEnabled]);

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
    if (connectionState === "connected" && !callStartedAt) {
      setCallStartedAt(Date.now());
    }
  }, [connectionState, callStartedAt]);

  useEffect(() => {
    if (!callStartedAt) {
      setDurationLabel("00:00");
      return;
    }

    const tick = () => {
      const elapsed = Math.max(0, Date.now() - callStartedAt);
      const totalSeconds = Math.floor(elapsed / 1000);
      const minutes = Math.floor(totalSeconds / 60);
      const seconds = totalSeconds % 60;
      setDurationLabel(
        `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
      );
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [callStartedAt]);

  useEffect(() => {
    const updateOutputs = async () => {
      if (!navigator.mediaDevices?.enumerateDevices) return;
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const outputs = devices.filter((d) => d.kind === "audiooutput");
        setAudioOutputs(outputs);
        if (!selectedOutputId && outputs[0]) {
          setSelectedOutputId(outputs[0].deviceId);
        }
      } catch {
        // Ignore device enumeration errors.
      }
    };

    void updateOutputs();
    navigator.mediaDevices?.addEventListener?.("devicechange", updateOutputs);
    return () => {
      navigator.mediaDevices?.removeEventListener?.("devicechange", updateOutputs);
    };
  }, [selectedOutputId]);

  useEffect(() => {
    const el = remoteVideoRef.current as HTMLVideoElement | null;
    if (!el) return;
    const setSinkId = (el as HTMLVideoElement & { setSinkId?: (id: string) => Promise<void> })
      .setSinkId;
    if (!setSinkId) return;
    if (!selectedOutputId) return;
    void setSinkId.call(el, selectedOutputId).catch(() => undefined);
  }, [selectedOutputId]);

  useEffect(() => {
    let lastBytes = 0;
    let lastTimestamp = 0;
    let interval: ReturnType<typeof setInterval> | null = null;

    const collectStats = async () => {
      const pc = peerRef.current;
      if (!pc) return;
      try {
        const stats = await pc.getStats();
        let inboundBytes = 0;
        let inboundTimestamp = 0;
        let packetsLost = 0;
        let packetsReceived = 0;

        stats.forEach((report) => {
          if (report.type === "inbound-rtp" && report.kind === "video") {
            inboundBytes = report.bytesReceived ?? inboundBytes;
            inboundTimestamp = report.timestamp ?? inboundTimestamp;
            packetsLost += report.packetsLost ?? 0;
            packetsReceived += report.packetsReceived ?? 0;
          }
        });

        if (lastTimestamp && inboundTimestamp > lastTimestamp) {
          const bytesDiff = inboundBytes - lastBytes;
          const timeDiff = (inboundTimestamp - lastTimestamp) / 1000;
          const bitrateKbps = timeDiff > 0 ? (bytesDiff * 8) / 1000 / timeDiff : 0;
          const total = packetsLost + packetsReceived;
          const lossPct = total > 0 ? (packetsLost / total) * 100 : 0;
          setQualityLabel(
            `Quality: ${Math.round(bitrateKbps)} kbps, loss ${lossPct.toFixed(1)}%`
          );
        }

        lastBytes = inboundBytes;
        lastTimestamp = inboundTimestamp;
      } catch {
        // Ignore stats errors.
      }
    };

    interval = setInterval(collectStats, 2000);
    void collectStats();

    return () => {
      if (interval) clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (!auth.isReady || !auth.token || !auth.name) return;
    if (!roomId) return;
    if (call === undefined) return;
    if (call === null || call.status === "ended") return;

    let cancelled = false;
    setError(null);
    setMediaError(null);
    setIsConnecting(true);
    setRtcReady(false);
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
        setConnectionState(pc.connectionState);
        if (pc.connectionState === "connected") {
          setIsConnecting(false);
        }
        if (pc.connectionState === "failed") {
          setError("Connection failed. Try rejoining.");
          void restartIce();
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: { facingMode: cameraFacing },
      });
      if (cancelled) {
        stopStream(stream);
        return;
      }
      localStreamRef.current = stream;
      cameraTrackRef.current = stream.getVideoTracks()[0] ?? null;
      if (muteOnJoin) {
        const audioTrack = stream.getAudioTracks()[0];
        if (audioTrack) audioTrack.enabled = false;
      }
      setLocalStream(stream);
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));
      setIsConnecting(false);
      setRtcReady(true);
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
      setRtcReady(false);
    };
  }, [
    auth.isReady,
    auth.token,
    auth.name,
    roomId,
    call,
    sendSignal,
    cameraFacing,
    reconnectNonce,
    muteOnJoin,
    restartIce,
  ]);

  const stopScreenShare = useCallback(async () => {
    if (!screenTrackRef.current) return;
    const screenTrack = screenTrackRef.current;
    screenTrackRef.current = null;
    screenTrack.stop();

    const stream = localStreamRef.current;
    const oldTrack = stream?.getVideoTracks()[0];
    if (oldTrack && oldTrack !== cameraTrackRef.current) {
      stream?.removeTrack(oldTrack);
    }

    let cameraTrack = cameraTrackRef.current;
    if (!cameraTrack || cameraTrack.readyState === "ended") {
      const camStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: cameraFacing },
        audio: false,
      });
      cameraTrack = camStream.getVideoTracks()[0] ?? null;
      cameraTrackRef.current = cameraTrack;
      camStream.getTracks().forEach((track) => {
        if (track !== cameraTrack) track.stop();
      });
    }

    if (cameraTrack) {
      stream?.addTrack(cameraTrack);
      const sender = peerRef.current?.getSenders().find((s) => s.track?.kind === "video");
      if (sender) {
        await sender.replaceTrack(cameraTrack);
      }
    }

    setLocalStream(new MediaStream(stream?.getTracks() ?? []));
    setIsSharing(false);
  }, [cameraFacing]);

  const startScreenShare = useCallback(async () => {
    if (!navigator.mediaDevices?.getDisplayMedia) {
      setError("Screen sharing not supported");
      return;
    }

    const stream = localStreamRef.current;
    if (!stream) return;

    const displayStream = await navigator.mediaDevices.getDisplayMedia({
      video: true,
    });

    const screenTrack = displayStream.getVideoTracks()[0];
    if (!screenTrack) return;

    screenTrackRef.current = screenTrack;
    screenTrack.onended = () => {
      void stopScreenShare();
    };

    const oldTrack = stream.getVideoTracks()[0];
    if (oldTrack) {
      stream.removeTrack(oldTrack);
    }

    stream.addTrack(screenTrack);

    const sender = peerRef.current?.getSenders().find((s) => s.track?.kind === "video");
    if (sender) {
      await sender.replaceTrack(screenTrack);
    }

    setLocalStream(new MediaStream(stream.getTracks()));
    setIsSharing(true);
  }, [stopScreenShare]);

  const toggleScreenShare = useCallback(async () => {
    if (isSharing) {
      await stopScreenShare();
      return;
    }
    try {
      await startScreenShare();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to share screen");
    }
  }, [isSharing, startScreenShare, stopScreenShare]);

  const toggleRecording = useCallback(() => {
    if (isRecording) {
      recorderRef.current?.stop();
      return;
    }

    if (typeof MediaRecorder === "undefined") {
      setError("Recording not supported in this browser");
      return;
    }

    const source = remoteStream ?? localStream;
    if (!source) return;

    recordChunksRef.current = [];
    const recorder = new MediaRecorder(source, { mimeType: "video/webm" });
    recorderRef.current = recorder;

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        recordChunksRef.current.push(event.data);
      }
    };

    recorder.onstop = () => {
      const blob = new Blob(recordChunksRef.current, { type: "video/webm" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `call-recording-${Date.now()}.webm`;
      a.click();
      URL.revokeObjectURL(url);
      setIsRecording(false);
    };

    recorder.start();
    setIsRecording(true);
  }, [isRecording, remoteStream, localStream]);

  const flipCamera = useCallback(async () => {
    if (isFlipping) return;
    if (!navigator.mediaDevices?.getUserMedia) return;
    if (!localStreamRef.current) return;
    if (isSharing) return;

    const nextFacing = cameraFacing === "user" ? "environment" : "user";
    setIsFlipping(true);

    try {
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: nextFacing },
        audio: false,
      });

      const newTrack = newStream.getVideoTracks()[0];
      if (!newTrack) return;

      const stream = localStreamRef.current;
      const oldTrack = stream?.getVideoTracks()[0];
      if (oldTrack) {
        oldTrack.stop();
        stream?.removeTrack(oldTrack);
      }

      stream?.addTrack(newTrack);
      cameraTrackRef.current = newTrack;

      const pc = peerRef.current;
      const sender = pc?.getSenders().find((s) => s.track?.kind === "video");
      if (sender) {
        await sender.replaceTrack(newTrack);
      }

      setLocalStream(new MediaStream(stream?.getTracks() ?? [newTrack]));
      setCameraFacing(nextFacing);

      newStream.getTracks().forEach((track) => {
        if (track !== newTrack) track.stop();
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to switch camera");
    } finally {
      setIsFlipping(false);
    }
  }, [cameraFacing, isFlipping, isSharing]);

  const reconnect = useCallback(() => {
    setReconnectNonce((prev) => prev + 1);
    setIsConnecting(true);
    setRtcReady(false);
    setRemoteStream(null);
    setLocalStream(null);
    setConnectionState("connecting");
    setCallStartedAt(null);
  }, []);

  useEffect(() => {
    if (!auth.token || !roomId) return;
    if (!isStarter) return;
    if (!rtcReady) return;
    if (sentOfferRef.current) return;
    if (!peerRef.current || peerRef.current.signalingState !== "stable") return;

    const run = async () => {
      try {
        const pc = peerRef.current;
        if (!pc) return;
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        sentOfferRef.current = true;
        await sendSignal({
          token: auth.token!,
          roomId,
          type: "offer",
          payload: JSON.stringify(offer),
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to start call");
      }
    };

    void run();
  }, [auth.token, roomId, isStarter, sendSignal, rtcReady]);

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
      <main className="theme-page min-h-screen w-full p-4 sm:p-6">
        <div className="mx-auto flex min-h-[calc(100vh-2rem)] w-full max-w-md items-center justify-center">
          <div className="theme-panel w-full rounded-2xl border p-8 shadow backdrop-blur">
            {autoStartError ? (
              <>
                <div className="theme-text text-base font-semibold">Could not start call</div>
                <p className="theme-muted mt-2 text-sm">{autoStartError}</p>
              </>
            ) : auth.isReady && auth.isLoggedIn ? (
              <>
                <div className="theme-text text-base font-semibold">
                  Starting a call in general…
                </div>
                <p className="theme-muted mt-2 text-sm">Hang tight while we create the room.</p>
              </>
            ) : (
              <>
                <div className="theme-text text-base font-semibold">Missing room id</div>
                <p className="theme-muted mt-2 text-sm">
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
      <main className="theme-page min-h-screen w-full p-4 sm:p-6">
        <div className="mx-auto flex min-h-[calc(100vh-2rem)] w-full max-w-md items-center justify-center">
          <div className="theme-panel w-full rounded-2xl border p-8 shadow backdrop-blur">
            <div className="theme-text text-base font-semibold">Checking session…</div>
          </div>
        </div>
      </main>
    );
  }

  if (!auth.isLoggedIn) {
    return (
      <main className="theme-page min-h-screen w-full p-4 sm:p-6">
        <div className="mx-auto flex min-h-[calc(100vh-2rem)] w-full max-w-md items-center justify-center">
          <div className="theme-panel w-full rounded-2xl border p-8 shadow backdrop-blur">
            <div className="theme-text text-base font-semibold">Sign in required</div>
            <p className="theme-muted mt-2 text-sm">
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
      <main className="theme-page min-h-screen w-full p-4 sm:p-6">
        <div className="mx-auto flex min-h-[calc(100vh-2rem)] w-full max-w-md items-center justify-center">
          <div className="theme-panel w-full rounded-2xl border p-8 shadow backdrop-blur">
            <div className="theme-text text-base font-semibold">Call not found</div>
            <p className="theme-muted mt-2 text-sm">This room id is not active.</p>
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
      <main className="theme-page min-h-screen w-full p-4 sm:p-6">
        <div className="mx-auto flex min-h-[calc(100vh-2rem)] w-full max-w-md items-center justify-center">
          <div className="theme-panel w-full rounded-2xl border p-8 shadow backdrop-blur">
            <div className="theme-text text-base font-semibold">Call ended</div>
            <p className="theme-muted mt-2 text-sm">This call is no longer active.</p>
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
      <main className="theme-page min-h-screen w-full p-4 sm:p-6">
        <div className="mx-auto flex min-h-[calc(100vh-2rem)] w-full max-w-md items-center justify-center">
          <div className="theme-panel w-full rounded-2xl border p-8 shadow backdrop-blur">
            <div className="theme-text text-base font-semibold">Could not join call</div>
            <p className="theme-muted mt-2 text-sm">{error}</p>
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
      <main className="theme-page min-h-screen w-full p-4 sm:p-6">
        <div className="mx-auto flex min-h-[calc(100vh-2rem)] w-full max-w-md items-center justify-center">
          <div className="theme-panel w-full rounded-2xl border p-8 shadow backdrop-blur">
            <div className="theme-text text-base font-semibold">
              Camera or microphone blocked
            </div>
            <p className="theme-muted mt-2 text-sm">{mediaError}</p>
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
      <main className="theme-page min-h-screen w-full p-4 sm:p-6">
        <div className="mx-auto flex min-h-[calc(100vh-2rem)] w-full max-w-md items-center justify-center">
          <div className="theme-panel w-full rounded-2xl border p-8 shadow backdrop-blur">
            <div className="theme-text text-base font-semibold">Connecting…</div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="theme-page min-h-screen w-full p-3 sm:p-6">
      <div className="mx-auto flex h-[calc(100vh-1.5rem)] w-full max-w-6xl flex-col gap-3 sm:h-[calc(100vh-3rem)] sm:gap-4">
        <div className="theme-panel flex-1 overflow-hidden rounded-2xl border p-2 shadow backdrop-blur sm:p-3">
          <div className="flex h-full flex-col">
            <header className="flex items-center justify-between gap-3 px-1 pb-2">
              <div className="min-w-0">
                <div className="theme-faint text-xs font-semibold tracking-widest">IN CALL</div>
                <div className="theme-text truncate text-base font-semibold">Room: {roomId}</div>
                <div className="theme-muted mt-1 text-xs font-semibold">
                  Status: {connectionState}
                </div>
                <div className="theme-muted mt-1 text-xs font-semibold">
                  Duration: {durationLabel}
                </div>
              </div>
              <button
                type="button"
                onClick={() => router.push("/chat")}
                className="theme-chip rounded-xl border px-4 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-cyan-400/40 active:scale-[0.98]"
              >
                Back
              </button>
            </header>

            {audioOutputs.length > 0 ? (
              <div className="mb-2 flex flex-wrap items-center gap-2 px-1">
                <label className="theme-faint text-xs font-semibold tracking-widest">
                  SPEAKER
                </label>
                <select
                  value={selectedOutputId}
                  onChange={(e) => setSelectedOutputId(e.target.value)}
                  className="theme-input rounded-xl border px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-cyan-400/40"
                >
                  {audioOutputs.map((d) => (
                    <option key={d.deviceId} value={d.deviceId}>
                      {d.label || "Speaker"}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}

            <div className="min-h-0 flex-1">
              <VideoGrid
                localStream={localStream}
                remoteStream={remoteStream}
                localLabel={auth.name ?? "You"}
                remoteLabel="Peer"
                pipMode={pipEnabled}
                blurLocal={blurEnabled}
                onRemoteVideoReady={(el) => {
                  remoteVideoRef.current = el;
                }}
              />
            </div>

            <div className="sticky bottom-0 pt-3 pb-1">
              <CallControls
                micEnabled={micEnabled}
                camEnabled={camEnabled}
                canFlipCam={Boolean(localStreamRef.current?.getVideoTracks()[0])}
                isFlipping={isFlipping}
                isSharing={isSharing}
                pipEnabled={pipEnabled}
                blurEnabled={blurEnabled}
                isRecording={isRecording}
                chatOpen={chatOpen}
                autoGainEnabled={autoGainEnabled}
                muteOnJoin={muteOnJoin}
                qualityLabel={qualityLabel}
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
                onFlipCam={flipCamera}
                onToggleShare={toggleScreenShare}
                onTogglePip={() => setPipEnabled((prev) => !prev)}
                onToggleBlur={() => setBlurEnabled((prev) => !prev)}
                onReconnect={reconnect}
                onToggleRecord={toggleRecording}
                onToggleChat={() => setChatOpen((prev) => !prev)}
                onToggleAutoGain={() => setAutoGainEnabled((prev) => !prev)}
                onToggleMuteOnJoin={() => {
                  const stream = localStreamRef.current;
                  const track = stream?.getAudioTracks()[0];
                  setMuteOnJoin((prev) => {
                    const next = !prev;
                    if (track) {
                      track.enabled = !next;
                      setMicEnabled(!next);
                    }
                    return next;
                  });
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

            {chatOpen && call?.conversationId ? (
              <div className="theme-overlay absolute right-3 top-16 z-20 h-[70vh] w-[90vw] max-w-sm rounded-2xl border p-3 shadow-xl backdrop-blur sm:right-6 sm:top-20">
                <div className="mb-2 flex items-center justify-between">
                  <div className="theme-faint text-xs font-semibold tracking-widest">
                    CHAT
                  </div>
                  <button
                    type="button"
                    onClick={() => setChatOpen(false)}
                    className="theme-chip rounded-lg border px-2 py-1 text-[11px] font-semibold"
                  >
                    Close
                  </button>
                </div>
                <div className="flex h-[calc(70vh-3.5rem)] flex-col">
                  <ChatFeed
                    currentUser={auth.name ?? "You"}
                    room={call.conversationId}
                    token={auth.token ?? ""}
                  />
                  <ChatForm token={auth.token ?? ""} room={call.conversationId} />
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </main>
  );
}
