import { notFound } from "next/navigation";
import dynamic from "next/dynamic";

const RoomChatClient = dynamic(
  () =>
    import("@/src/componnets/chat/RoomChatClient").then((m) => m.RoomChatClient),
  { ssr: false }
);

export default function ChatRoomPage({ params }: { params: { room: string } }) {
  const room = params.room;
  if (!room) return notFound();
  return <RoomChatClient room={room} />;
}