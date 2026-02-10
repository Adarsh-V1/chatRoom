import { notFound } from "next/navigation";
import { RoomClientOnly } from "../RoomClientOnly";

export default async function ChatRoomPage({
  params,
}: {
  params: Promise<{ room: string }>;
}) {
  const { room } = await params;
  if (!room) return notFound();
  return <RoomClientOnly room={room} />;
}