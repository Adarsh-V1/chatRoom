"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { Info, PhoneCall, UsersRound } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { api } from "@/convex/_generated/api";
import { LoadingScreen, PageContainer, PageShell } from "@/src/components/app/page-shell";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import { Card } from "@/src/components/ui/card";
import { useChatAuth } from "@/src/features/auth/useChatAuth";
import { ChatDetailsPanel } from "@/src/features/chat/ChatDetailsPanel";
import { ChatMobileSheet } from "@/src/features/chat/ChatMobileSheet";
import { ChatFeed } from "@/src/features/chat/chatFeed";
import { ChatForm } from "@/src/features/chat/chatForm";
import { OnlineAs } from "@/src/features/chat/OnlineAs";
import { UserListSidebar } from "@/src/features/chat/UserListSidebar";
import { useHorizontalSwipe } from "@/src/features/chat/useHorizontalSwipe";
import { PriorityStarButton } from "@/src/features/focus/PriorityStarButton";
import { WorkspaceTour } from "@/src/features/onboarding/WorkspaceTour";
import {
  buildCallHref,
  buildConversationRefFromRoom,
  buildDirectConversationRef,
  buildGeneralConversationRef,
} from "@/src/features/workspace/conversations";

interface RoomChatClientProps {
  room: string;
  peerName?: string | null;
  conversationTitle?: string;
  returnTo?: string;
  avatarUrl?: string | null;
}

const RoomChatClient = ({ room, peerName, conversationTitle, returnTo, avatarUrl }: RoomChatClientProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const auth = useChatAuth();
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isUserListOpen, setIsUserListOpen] = useState(false);
  const [tourOpen, setTourOpen] = useState(false);
  const startCall = useMutation(api.calls.startCall);
  const endCall = useMutation(api.calls.endCall);
  const saveLastVisited = useMutation(api.workspace.saveLastVisited);

  const username = auth.name ?? "";
  const token = auth.token ?? "";
  const resolvedReturnTo = useMemo(() => returnTo ?? pathname ?? "/chat", [pathname, returnTo]);

  const directPeerName = useMemo(() => {
    if (peerName?.trim()) return peerName.trim();
    if (!username || !room) return null;
    const normalized = username.trim().toLowerCase();
    const parts = room.split("-").filter(Boolean);
    if (parts.length !== 2) return null;
    const hasMe = parts.some((part) => part.toLowerCase() === normalized);
    if (!hasMe) return null;
    return parts.find((part) => part.toLowerCase() !== normalized) ?? null;
  }, [peerName, room, username]);

  const resolvedConversationTitle = useMemo(() => {
    if (conversationTitle?.trim()) return conversationTitle.trim();
    if (room === "general") return "General room";
    if (directPeerName) return directPeerName;
    return room;
  }, [conversationTitle, directPeerName, room]);
  const tourRequested = searchParams.get("tour") === "1" && room === "general";

  const activeCall = useQuery(api.calls.getActiveCall, auth.isLoggedIn ? { token, conversationId: room } : "skip");

  useEffect(() => {
    if (!auth.isLoggedIn || !token || !username) return;

    const ref =
      room === "general"
        ? buildGeneralConversationRef()
        : directPeerName
          ? buildDirectConversationRef(username, directPeerName)
          : buildConversationRefFromRoom(room, username);

    if (!ref) return;
    void saveLastVisited({ token, conversationRef: ref });
  }, [auth.isLoggedIn, directPeerName, room, saveLastVisited, token, username]);

  const joinOrStartCall = async () => {
    if (!auth.isLoggedIn) return;

    if (activeCall?.roomId) {
      router.push(buildCallHref(activeCall.roomId, resolvedReturnTo));
      return;
    }

    const result = await startCall({ token, conversationId: room });
    router.push(buildCallHref(result.roomId, resolvedReturnTo));
  };

  const isCallStarter = Boolean(
    activeCall?.startedByName && auth.name && activeCall.startedByName.trim().toLowerCase() === auth.name.trim().toLowerCase()
  );

  const swipeHandlers = useHorizontalSwipe({
    onSwipeLeft: () => setIsUserListOpen(true),
    onSwipeRight: () => setIsDetailsOpen(true),
    disabled: isUserListOpen || isDetailsOpen,
  });

  if (!auth.isReady) {
    return <LoadingScreen title="Loading room..." description="Preparing the direct thread, room metadata, and presence." />;
  }

  return (
    <PageShell className="flex h-[calc(100dvh-var(--app-header-height))] min-h-0 flex-col overflow-hidden">
      <PageContainer className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[18rem_minmax(0,1fr)]">
          <div className="hidden min-h-0 lg:block">
            <UserListSidebar
              currentUser={username}
              token={token}
              onSelectUser={(user) => {
                if (!user || user === username) return;
                router.push(`/chat/direct/${encodeURIComponent(user)}`);
              }}
              className="h-full min-h-0"
            />
          </div>

          <Card className="flex h-full min-h-0 flex-col overflow-hidden p-4 sm:p-5" {...swipeHandlers}>
            <div className="flex flex-col gap-4 border-b border-[color:var(--border-1)] pb-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0">
                <div className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--accent-text)]">Online as</div>
                <OnlineAs token={token} room={room} peerName={directPeerName} />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button variant="outline" size="sm" className="lg:hidden" onClick={() => setIsUserListOpen(true)}>
                  <UsersRound className="h-4 w-4" aria-hidden="true" />
                  People
                </Button>
                <Button variant="outline" size="sm" className="lg:hidden" onClick={() => setIsDetailsOpen(true)}>
                  <Info className="h-4 w-4" aria-hidden="true" />
                  Profile
                </Button>
                <PriorityStarButton token={token} kind="room" room={room} />
                {room === "general" ? (
                  <Button variant="outline" size="sm" onClick={() => setTourOpen(true)}>
                    Tour
                  </Button>
                ) : null}
                <Button variant="secondary" size="sm" onClick={joinOrStartCall}>
                  <PhoneCall className="h-4 w-4" aria-hidden="true" />
                  {activeCall?.roomId ? "Join call" : "Start call"}
                </Button>
                <Badge variant="secondary" className="normal-case tracking-normal text-xs">
                  {directPeerName ? `Direct thread: ${directPeerName}` : `Room: ${resolvedConversationTitle}`}
                </Badge>
              </div>
            </div>

            {activeCall?.roomId ? (
              <div className="mt-4 flex flex-col gap-3 rounded-[24px] border border-[color:var(--brand-border)] bg-[color:var(--surface-3)] px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                <button
                  type="button"
                  onClick={() => router.push(buildCallHref(activeCall.roomId, resolvedReturnTo))}
                  className="flex min-w-0 flex-1 items-center justify-between gap-4 text-left"
                >
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
              <ChatFeed currentUser={username} room={room} token={token} />
              <ChatForm token={token} room={room} />
            </div>
          </Card>
        </div>
      </PageContainer>

      <ChatMobileSheet open={isUserListOpen} onClose={() => setIsUserListOpen(false)} side="left">
        <UserListSidebar
          currentUser={username}
          token={token}
          onSelectUser={(user) => {
            if (!user || user === username) return;
            router.push(`/chat/direct/${encodeURIComponent(user)}`);
            setIsUserListOpen(false);
          }}
          className="h-full"
        />
      </ChatMobileSheet>

      <ChatMobileSheet open={isDetailsOpen} onClose={() => setIsDetailsOpen(false)} side="right">
        <ChatDetailsPanel
          title={resolvedConversationTitle}
          subtitle="Room chat"
          avatarUrl={avatarUrl}
          token={token}
          peerName={directPeerName}
          room={room}
          onVideoCall={() => {
            setIsDetailsOpen(false);
            void joinOrStartCall();
          }}
        />
      </ChatMobileSheet>

      {room === "general" ? (
        <WorkspaceTour
          open={tourOpen || tourRequested}
          onClose={() => {
            setTourOpen(false);
            if (!tourRequested) return;
            const params = new URLSearchParams(searchParams.toString());
            params.delete("tour");
            const nextQuery = params.toString();
            router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname);
          }}
        />
      ) : null}
    </PageShell>
  );
};

export { RoomChatClient };
