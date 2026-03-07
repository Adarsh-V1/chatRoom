"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { Info, PhoneCall, UsersRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { LoadingScreen, PageContainer, PageHeader, PageShell } from "@/src/components/app/page-shell";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import { Card } from "@/src/components/ui/card";
import { LoginCard } from "@/src/features/auth/LoginCard";
import { useChatAuth } from "@/src/features/auth/useChatAuth";
import { ChatDetailsPanel } from "@/src/features/chat/ChatDetailsPanel";
import { ChatMobileSheet } from "@/src/features/chat/ChatMobileSheet";
import { ChatFeed } from "@/src/features/chat/chatFeed";
import { ChatForm } from "@/src/features/chat/chatForm";
import { OnlineAs } from "@/src/features/chat/OnlineAs";
import { UserListSidebar } from "@/src/features/chat/UserListSidebar";
import { useHorizontalSwipe } from "@/src/features/chat/useHorizontalSwipe";
import { PriorityStarButton } from "@/src/features/focus/PriorityStarButton";
import { TourPrompt, WorkspaceTour } from "@/src/features/onboarding/WorkspaceTour";
import { getTourState, markTourDone, markTourSkipped } from "@/src/features/onboarding/tourStorage";

const GeneralChatClient = () => {
  const router = useRouter();
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [isUserListOpen, setIsUserListOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [tourPromptDismissed, setTourPromptDismissed] = useState(false);
  const [tourOpen, setTourOpen] = useState(false);

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
  const shouldOfferTour = auth.isLoggedIn && Boolean(username) && getTourState(username) === "pending" && !tourPromptDismissed && !tourOpen;
  const swipeHandlers = useHorizontalSwipe({
    onSwipeLeft: () => setIsUserListOpen(true),
    onSwipeRight: () => setIsDetailsOpen(true),
    disabled: isUserListOpen || isDetailsOpen,
  });

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
              onGoogleSubmit={auth.loginWithGoogle}
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
    <PageShell className="flex h-[calc(100dvh-var(--app-header-height))] min-h-0 flex-col overflow-hidden">
      <PageContainer className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <PageHeader
          eyebrow="Workspace"
          title={selectedUser && selectedUser !== username ? `Direct chat with ${selectedUser}` : "General room"}
          description="A responsive multi-theme workspace tuned for daily team messaging, direct threads, priorities, and quick calls."
          action={<Badge variant={isPriority ? "warning" : "outline"}>{isPriority ? "Priority room" : "Standard room"}</Badge>}
        />

        <div className="grid min-h-0 flex-1 gap-4 xl:grid-cols-[22rem_minmax(0,1fr)_20rem]">
          <div className="hidden min-h-0 lg:block" data-tour="people">
            <UserListSidebar
              currentUser={username}
              token={token}
              onSelectUser={(user) => setSelectedUser(user === username ? null : user)}
              selectedUser={selectedUser}
              className="h-full min-h-0"
            />
          </div>

          <Card className="flex h-full min-h-0 flex-col overflow-hidden p-4 sm:p-5" {...swipeHandlers}>
            <div className="flex flex-col gap-4 border-b border-[color:var(--border-1)] pb-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0" data-tour="status">
                <div className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--accent-text)]">Online as</div>
                <OnlineAs token={token} room={chatRoom} peerName={selectedUser && selectedUser !== username ? selectedUser : null} />
              </div>

              <div className="flex flex-wrap items-center gap-2" data-tour="actions">
                <Button variant="outline" size="sm" className="lg:hidden" onClick={() => setIsUserListOpen(true)}>
                  <UsersRound className="h-4 w-4" aria-hidden="true" />
                  People
                </Button>
                <Button variant="outline" size="sm" className="xl:hidden" onClick={() => setIsDetailsOpen(true)}>
                  <Info className="h-4 w-4" aria-hidden="true" />
                  Profile
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
              <div className="mt-4 flex flex-col gap-3 rounded-[24px] border border-[color:var(--brand-border)] bg-[color:var(--surface-3)] px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                <button type="button" onClick={() => router.push(`/call/${activeCall.roomId}`)} className="flex min-w-0 flex-1 items-center justify-between gap-4 text-left">
                  <div className="min-w-0">
                    <div className="text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--accent-text)]">Active call</div>
                    <div className="truncate text-sm font-semibold text-[color:var(--text-1)]">
                      {activeCall.startedByName ? `Started by ${activeCall.startedByName}` : "A call is already in progress"}
                    </div>
                  </div>
                  <Badge variant="default">Join now</Badge>
                </button>
                {isCallStarter ? (
                  <Button
                    variant="destructive"
                    size="sm"
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
              <div data-tour="composer">
                <ChatForm token={token} room={chatRoom} />
              </div>
            </div>
          </Card>

          <div className="hidden min-h-0 xl:block">
            <ChatDetailsPanel
              title={selectedUser && selectedUser !== username ? selectedUser : "General room"}
              subtitle={selectedUser && selectedUser !== username ? "Peer insight" : "Workspace overview"}
              token={token}
              peerName={selectedUser && selectedUser !== username ? selectedUser : null}
              room={chatRoom}
              onVideoCall={joinOrStartCall}
            />
          </div>
        </div>
      </PageContainer>

      <ChatMobileSheet open={isUserListOpen} onClose={() => setIsUserListOpen(false)} side="left">
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
      </ChatMobileSheet>

      <ChatMobileSheet open={isDetailsOpen} onClose={() => setIsDetailsOpen(false)} side="right">
        <ChatDetailsPanel
          title={selectedUser && selectedUser !== username ? selectedUser : "General room"}
          subtitle={selectedUser && selectedUser !== username ? "Peer insight" : "Workspace overview"}
          token={token}
          peerName={selectedUser && selectedUser !== username ? selectedUser : null}
          room={chatRoom}
          onVideoCall={() => {
            setIsDetailsOpen(false);
            void joinOrStartCall();
          }}
        />
      </ChatMobileSheet>

      <TourPrompt
        open={shouldOfferTour}
        onClose={() => {
          if (username) {
            markTourSkipped(username);
            toast.message("Tour skipped. You can explore on your own.");
          }
          setTourPromptDismissed(true);
        }}
        onStart={() => {
          setTourPromptDismissed(true);
          setTourOpen(true);
        }}
      />
      <WorkspaceTour
        key={tourOpen ? "tour-open" : "tour-closed"}
        open={tourOpen}
        onClose={() => {
          if (username) {
            markTourDone(username);
            toast.success("Tour complete");
          }
          setTourOpen(false);
        }}
      />
    </PageShell>
  );
};

export { GeneralChatClient };
