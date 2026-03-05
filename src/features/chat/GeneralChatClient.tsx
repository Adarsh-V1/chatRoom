"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { PhoneCall, UsersRound, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { LoadingScreen, PageContainer, PageHeader, PageShell } from "@/src/components/app/page-shell";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import { Card } from "@/src/components/ui/card";
import { LoginCard } from "@/src/features/auth/LoginCard";
import { useChatAuth } from "@/src/features/auth/useChatAuth";
import { ChatFeed } from "@/src/features/chat/chatFeed";
import { ChatForm } from "@/src/features/chat/chatForm";
import { OnlineAs } from "@/src/features/chat/OnlineAs";
import { UserListSidebar } from "@/src/features/chat/UserListSidebar";
import { PriorityStarButton } from "@/src/features/focus/PriorityStarButton";

const GeneralChatClient = () => {
  const router = useRouter();
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [isUserListOpen, setIsUserListOpen] = useState(false);

  const auth = useChatAuth();
  const generateUploadUrl = useMutation(api.chats.generateUploadUrl);
  const setMyProfilePicture = useMutation(api.users.setMyProfilePicture);
  const startCall = useMutation(api.calls.startCall);
  const endCall = useMutation(api.calls.endCall);

  const username = auth.name ?? "";
  const token = auth.token ?? "";
  const chatRoom =
    selectedUser && selectedUser !== username
      ? [username.toLowerCase(), selectedUser.toLowerCase()].sort().join("-")
      : "general";

  const activeCall = useQuery(
    api.calls.getActiveCall,
    auth.isLoggedIn ? { token, conversationId: chatRoom } : "skip"
  );

  const joinOrStartCall = async () => {
    if (!auth.isLoggedIn) return;

    if (activeCall?.roomId) {
      router.push(`/call/${activeCall.roomId}`);
      return;
    }

    const result = await startCall({ token, conversationId: chatRoom });
    router.push(`/call/${result.roomId}`);
  };

  const isCallStarter = Boolean(
    activeCall?.startedByName && auth.name && activeCall.startedByName.trim().toLowerCase() === auth.name.trim().toLowerCase()
  );

  const roomPriority = useQuery(api.priorities.getRoomPriority, auth.isLoggedIn ? { token, room: chatRoom } : "skip");
  const isPriority = Boolean(roomPriority?.priority);

  if (!auth.isReady) {
    return <LoadingScreen title="Loading workspace..." description="Checking your local session and preparing chat." />;
  }

  if (!auth.isLoggedIn) {
    return (
      <PageShell>
        <PageContainer className="flex min-h-[calc(100dvh-8rem)] items-center justify-center">
          <div className="w-full max-w-xl">
            <LoginCard
              title="Enter the lobby"
              subtitle="Choose a username and sign in with your account password."
              onSubmit={async ({ name, password, profileFile }) => {
                const result = await auth.login({ name, password });

                if (profileFile) {
                  const uploadUrl = await generateUploadUrl({ token: result.token });
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
        </PageContainer>
      </PageShell>
    );
  }

  return (
    <PageShell className="flex flex-col overflow-hidden">
      <PageContainer className="flex min-h-0 flex-1 flex-col">
        <PageHeader
          eyebrow="Workspace"
          title={selectedUser && selectedUser !== username ? `Direct chat with ${selectedUser}` : "General room"}
          description="A responsive light interface tuned for daily team messaging, direct threads, priorities, and quick calls."
          action={<Badge variant={isPriority ? "warning" : "outline"}>{isPriority ? "Priority room" : "Standard room"}</Badge>}
        />

        <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[22rem_minmax(0,1fr)]">
          <div className="hidden min-h-0 lg:block">
            <UserListSidebar
              currentUser={username}
              token={token}
              onSelectUser={(user) => setSelectedUser(user === username ? null : user)}
              selectedUser={selectedUser}
              className="h-full min-h-0"
            />
          </div>

          <Card className="flex h-full min-h-0 flex-col overflow-hidden p-4 sm:p-5">
            <div className="flex flex-col gap-4 border-b border-[color:var(--border-1)] pb-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0">
                <div className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--accent-text)]">Online as</div>
                <OnlineAs token={token} room={chatRoom} peerName={selectedUser && selectedUser !== username ? selectedUser : null} />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button variant="outline" size="sm" className="lg:hidden" onClick={() => setIsUserListOpen(true)}>
                  <UsersRound className="h-4 w-4" aria-hidden="true" />
                  People
                </Button>
                <PriorityStarButton token={token} kind="room" room={chatRoom} />
                <Button variant="secondary" size="sm" onClick={joinOrStartCall}>
                  <PhoneCall className="h-4 w-4" aria-hidden="true" />
                  {activeCall?.roomId ? "Join call" : "Start call"}
                </Button>
                <Badge variant="secondary" className="normal-case tracking-normal text-xs">
                  {selectedUser && selectedUser !== username ? `Direct thread: ${selectedUser}` : "Room: general"}
                </Badge>
              </div>
            </div>

            {activeCall?.roomId ? (
              <div className="mt-4 flex flex-col gap-3 rounded-[24px] border border-cyan-300/60 bg-cyan-100/68 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                <button type="button" onClick={() => router.push(`/call/${activeCall.roomId}`)} className="flex min-w-0 flex-1 items-center justify-between gap-4 text-left">
                  <div className="min-w-0">
                    <div className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-800">Active call</div>
                    <div className="truncate text-sm font-semibold text-[color:var(--text-1)]">
                      {activeCall.startedByName ? `Started by ${activeCall.startedByName}` : "A call is already in progress"}
                    </div>
                  </div>
                  <Badge variant="default">Join now</Badge>
                </button>
                {isCallStarter ? (
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-rose-300/80 bg-rose-50/84 text-rose-700 hover:border-rose-400/80 hover:bg-rose-100/92"
                    onClick={() => {
                      if (!token) return;
                      void endCall({ token, roomId: activeCall.roomId });
                    }}
                  >
                    End call
                  </Button>
                ) : null}
              </div>
            ) : null}

            <div className="mt-4 flex min-h-0 flex-1 flex-col overflow-hidden">
              <ChatFeed currentUser={username} room={chatRoom} token={token} />
              <ChatForm token={token} room={chatRoom} />
            </div>
          </Card>
        </div>
      </PageContainer>

      {isUserListOpen ? (
        <div className="fixed inset-0 z-50 flex bg-slate-950/20 backdrop-blur-sm lg:hidden">
          <button type="button" className="absolute inset-0" aria-label="Close people" onClick={() => setIsUserListOpen(false)} />
          <div className="relative ml-auto h-full w-[90vw] max-w-sm p-3 animate-[slideIn_0.2s_ease-out]">
            <div className="absolute right-6 top-6 z-10">
              <Button variant="secondary" size="icon" onClick={() => setIsUserListOpen(false)} aria-label="Close people">
                <X className="h-4 w-4" aria-hidden="true" />
              </Button>
            </div>
            <UserListSidebar
              currentUser={username}
              token={token}
              onSelectUser={(user) => {
                setSelectedUser(user === username ? null : user);
                setIsUserListOpen(false);
              }}
              selectedUser={selectedUser}
              className="h-full"
            />
          </div>
        </div>
      ) : null}
    </PageShell>
  );
};

export { GeneralChatClient };
