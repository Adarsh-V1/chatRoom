"use client";

import dynamic from "next/dynamic";
import { LoadingScreen } from "@/src/components/app/page-shell";

type Props = {
  room: string;
};

const RoomChatClient = dynamic(() => import("@/src/features/chat/RoomChatClient").then((m) => m.RoomChatClient), {
  ssr: false,
  loading: () => <LoadingScreen title="Loading room..." description="Preparing the selected room and sidebar data." />,
});

export function RoomClientOnly({ room }: Props) {
  return <RoomChatClient room={room} />;
}
