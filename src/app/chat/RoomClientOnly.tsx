"use client";

import { Suspense } from "react";
import dynamic from "next/dynamic";
import { usePathname, useSearchParams } from "next/navigation";
import { LoadingScreen } from "@/src/components/app/page-shell";
import { ProtectedRoute } from "@/src/features/auth/ProtectedRoute";

type Props = {
  room: string;
};

const RoomChatClient = dynamic(() => import("@/src/features/chat/RoomChatClient").then((m) => m.RoomChatClient), {
  ssr: false,
  loading: () => <LoadingScreen title="Loading room..." description="Preparing the selected room and sidebar data." />,
});

function RoomClientOnlyInner({ room }: Props) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const qs = searchParams.toString();
  const returnTo = `${pathname}${qs ? `?${qs}` : ""}`;

  return (
    <ProtectedRoute
      title="Open conversation"
      subtitle="Sign in to load this room, restore unread state, and keep the call context tied to the conversation."
      returnTo={returnTo}
      loadingTitle="Loading room..."
      loadingDescription="Preparing the selected room and sidebar data."
    >
      <RoomChatClient room={room} />
    </ProtectedRoute>
  );
}

export function RoomClientOnly({ room }: Props) {
  return (
    <Suspense
      fallback={
        <LoadingScreen title="Loading room..." description="Preparing the selected room and sidebar data." />
      }
    >
      <RoomClientOnlyInner room={room} />
    </Suspense>
  );
}
