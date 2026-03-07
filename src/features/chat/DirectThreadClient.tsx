"use client";

import { useMemo } from "react";
import { useQuery } from "convex/react";

import { api } from "@/convex/_generated/api";
import { CenteredState, LoadingScreen } from "@/src/components/app/page-shell";
import { RoomChatClient } from "@/src/features/chat/RoomChatClient";
import { useChatAuth } from "@/src/features/auth/useChatAuth";
import { buildDirectConversationRef } from "@/src/features/workspace/conversations";

type Props = {
  user: string;
};

export function DirectThreadClient({ user }: Props) {
  const auth = useChatAuth();
  const conversationRef = useMemo(() => {
    if (!auth.name) return null;
    return buildDirectConversationRef(auth.name, user);
  }, [auth.name, user]);

  const meta = useQuery(
    api.workspace.getConversationMeta,
    auth.isLoggedIn && auth.token && conversationRef
      ? { token: auth.token, conversationRef }
      : "skip"
  );

  if (!auth.isReady || meta === undefined) {
    return (
      <LoadingScreen
        title="Loading direct thread..."
        description="Preparing the dedicated route, presence, and room metadata."
      />
    );
  }

  if (!meta || meta.access !== "allowed") {
    return (
      <CenteredState
        title="Direct thread unavailable"
        description="That teammate could not be resolved for a dedicated direct-message route."
      />
    );
  }

  return (
    <RoomChatClient
      room={meta.conversation.room}
      peerName={meta.peer?.name ?? meta.conversation.title}
      conversationTitle={meta.conversation.title}
      returnTo={meta.conversation.route}
      avatarUrl={meta.peer?.avatarUrl ?? null}
    />
  );
}
