import { notFound } from "next/navigation";
import { RoomClientOnly } from "../RoomClientOnly";

export default function ChatRoomPage({ params }: { params: { room: string } }) {
  const room = params.room;
  if (!room) return notFound();
  return <RoomClientOnly room={room} />;
}