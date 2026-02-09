import { notFound } from "next/navigation";
import { RoomChatClient } from "@/src/componnets/chat/RoomChatClient";

export default function ChatRoomPage({ params }: { params: { room: string } }) {
  const room = params.room;
  if (!room) return notFound();
  return <RoomChatClient room={room} />;
}