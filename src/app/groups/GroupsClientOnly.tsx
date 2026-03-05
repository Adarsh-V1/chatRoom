"use client";

import dynamic from "next/dynamic";
import { LoadingScreen } from "@/src/components/app/page-shell";

const GroupsClient = dynamic(() => import("@/src/features/groups/GroupsClient").then((m) => m.GroupsClient), {
  ssr: false,
  loading: () => <LoadingScreen title="Loading groups..." description="Fetching your memberships, invites, and public rooms." />,
});

export function GroupsClientOnly() {
  return <GroupsClient />;
}
