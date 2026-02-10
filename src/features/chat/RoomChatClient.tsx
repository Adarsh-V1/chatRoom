"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { ChatFeed } from "./chatFeed";
import { ChatForm } from "./chatForm";
import { ChatDetailsPanel } from "./ChatDetailsPanel";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { LoginCard } from "@/src/features/auth/LoginCard";
import { useChatAuth } from "@/src/features/auth/useChatAuth";
import { OnlineAs } from "@/src/features/chat/OnlineAs";
import { FocusModeToggle } from "@/src/features/focus/FocusModeToggle";
import { PriorityStarButton } from "@/src/features/focus/PriorityStarButton";
import { PrivacyBlurOverlay, PrivacyToggleButton } from "@/src/features/privacy/PrivacyControls";
import { usePrivacyBlur } from "@/src/features/privacy/usePrivacyBlur";
import { ThemeToggle } from "@/src/features/theme/ThemeToggle";

interface RoomChatClientProps { 
  room: string;
}

const RoomChatClient = ({ room }: RoomChatClientProps) => {
  const router = useRouter();
  const auth = useChatAuth();
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const generateUploadUrl = useMutation(api.chats.generateUploadUrl);
  const setMyProfilePicture = useMutation(api.users.setMyProfilePicture);
  const startCall = useMutation(api.calls.startCall);

  const username = auth.name ?? "";
  const token = auth.token ?? "";

  const activeCall = useQuery(
    api.calls.getActiveCall,
    auth.isLoggedIn ? { conversationId: room } : "skip"
  );

  const joinOrStartCall = async () => {
    if (!auth.isLoggedIn) return;

    if (activeCall?.roomId) {
      router.push(`/call/${activeCall.roomId}`);
      return;
    }

    const result = await startCall({ token, conversationId: room });
    router.push(`/call/${result.roomId}`);
  };

  const roomPriority = useQuery(
    api.priorities.getRoomPriority,
    auth.isLoggedIn ? { token, room } : "skip"
  );
  const isPriority = Boolean(roomPriority?.priority);

  const privacy = usePrivacyBlur({ idleMs: 30_000 });

  if (!auth.isReady) {
    return (
        <main className="h-screen w-full overflow-hidden theme-page p-4 sm:p-6">
        <div className="mx-auto flex min-h-[calc(100vh-2rem)] w-full max-w-md items-center justify-center">
          <div className="w-full rounded-2xl border theme-card p-8 shadow backdrop-blur">
            <div className="text-sm font-semibold theme-muted">Loading…</div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="h-screen w-full overflow-hidden theme-page p-4 sm:p-6">
      {auth.isLoggedIn ? (
        <div className="mx-auto grid h-full w-full max-w-6xl grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
          <section className="relative flex h-full min-h-0 flex-1 flex-col rounded-2xl border theme-panel p-4 shadow backdrop-blur">
            <header className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div>
                <div className="text-xs font-semibold tracking-widest theme-faint">ONLINE AS</div>
                <OnlineAs token={token} />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsDetailsOpen(true)}
                  className="inline-flex items-center justify-center rounded-full border px-3 py-2 text-xs font-semibold shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-400/40 active:scale-[0.98] theme-chip lg:hidden"
                  aria-label="Open details"
                >
                  Details
                </button>
                <FocusModeToggle token={token} />
                <PrivacyToggleButton
                  isOn={privacy.manualPrivacy}
                  onToggle={() => privacy.setManualPrivacy(!privacy.manualPrivacy)}
                />
                <ThemeToggle />
                <PriorityStarButton token={token} kind="room" room={room} />

                <button
                  type="button"
                  onClick={joinOrStartCall}
                  className="inline-flex items-center justify-center rounded-full border p-3 shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-400/40 active:scale-[0.98] theme-chip"
                  aria-label={activeCall?.roomId ? "Join call" : "Start call"}
                  title={activeCall?.roomId ? "Join call" : "Start call"}
                >
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
                </button>

                <div className="rounded-full border px-4 py-2 text-sm font-semibold theme-chip">
                  Room: <span className="theme-accent">{room}</span>
                </div>
              </div>
            </header>

            {activeCall?.roomId ? (
              <button
                type="button"
                onClick={() => router.push(`/call/${activeCall.roomId}`)}
                className="mb-3 flex w-full items-center justify-between gap-3 rounded-2xl border border-indigo-400/25 bg-indigo-500/10 px-4 py-3 text-left text-sm theme-text hover:bg-indigo-500/15 focus:outline-none focus:ring-2 focus:ring-indigo-400/50"
              >
                <div className="min-w-0">
                  <div className="text-xs font-semibold tracking-widest text-indigo-200/90">
                    ACTIVE CALL
                  </div>
                  <div className="truncate text-sm font-semibold">
                    {activeCall.startedByName
                      ? `Started by ${activeCall.startedByName}`
                      : "A call is in progress"}
                  </div>
                </div>
                <div className="shrink-0 rounded-full border px-3 py-1 text-xs font-semibold theme-chip">
                  Join
                </div>
              </button>
            ) : null}

            <PrivacyBlurOverlay visible={privacy.isBlurred} />

            <ChatFeed currentUser={username} room={room} token={token} isPriority={isPriority} />
            <ChatForm token={token} room={room} />
          </section>

          <div className="hidden lg:block">
            <ChatDetailsPanel
              title={room}
              subtitle="Room chat"
              onVideoCall={joinOrStartCall}
            />
          </div>
        </div>
      ) : (
        <div className="mx-auto flex min-h-[calc(100vh-2rem)] w-full max-w-md items-center justify-center">
          <LoginCard
            title="Join room"
            subtitle={`Entering ${room}. Use the same password to return.`}
            onSubmit={async ({ name, password, profileFile }) => {
              const result = await auth.login({ name, password });

              if (profileFile) {
                const uploadUrl = await generateUploadUrl({});
                const res = await fetch(uploadUrl, {
                  method: "POST",
                  headers: {
                    "Content-Type": profileFile.type || "application/octet-stream",
                  },
                  body: profileFile,
                });
                if (res.ok) {
                  const json = (await res.json()) as { storageId: string };
                  await setMyProfilePicture({
                    token: result.token,
                    storageId: json.storageId as Id<"_storage">,
                  });
                }
              }
            }}
          />
        </div>
      )}

      {isDetailsOpen ? (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/50"
            aria-label="Close details"
            onClick={() => setIsDetailsOpen(false)}
          />
          <div className="relative ml-auto h-full w-[86vw] max-w-sm animate-[slideIn_0.2s_ease-out]">
            <div className="absolute left-3 top-3 z-10">
              <button
                type="button"
                onClick={() => setIsDetailsOpen(false)}
                className="rounded-full border px-3 py-1 text-xs font-semibold theme-chip"
              >
                Close
              </button>
            </div>
            <ChatDetailsPanel
              title={room}
              subtitle="Room chat"
              onVideoCall={() => {
                setIsDetailsOpen(false);
                void joinOrStartCall();
              }}
            />
          </div>
        </div>
      ) : null}
    </main>
  );
};

export { RoomChatClient };
