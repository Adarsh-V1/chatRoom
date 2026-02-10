import { notFound } from "next/navigation";
import { GroupRoomClientOnly } from "../GroupRoomClientOnly";

export default async function GroupRoomPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (!slug) return notFound();
  return <GroupRoomClientOnly slug={slug} />;
}
