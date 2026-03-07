import { notFound } from "next/navigation";

import { DirectClientOnly } from "../DirectClientOnly";

export default async function DirectThreadPage({
  params,
}: {
  params: Promise<{ user: string }>;
}) {
  const { user } = await params;
  if (!user) return notFound();
  return <DirectClientOnly user={decodeURIComponent(user)} />;
}
