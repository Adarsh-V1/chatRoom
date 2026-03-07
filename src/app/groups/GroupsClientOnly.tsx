"use client";

import { Suspense } from "react";
import dynamic from "next/dynamic";
import { usePathname, useSearchParams } from "next/navigation";
import { LoadingScreen } from "@/src/components/app/page-shell";
import { ProtectedRoute } from "@/src/features/auth/ProtectedRoute";

const GroupsClient = dynamic(() => import("@/src/features/groups/GroupsClient").then((m) => m.GroupsClient), {
  ssr: false,
  loading: () => <LoadingScreen title="Loading groups..." description="Fetching your memberships, invites, and public rooms." />,
});

function GroupsClientOnlyInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const qs = searchParams.toString();
  const returnTo = `${pathname}${qs ? `?${qs}` : ""}`;

  return (
    <ProtectedRoute
      title="Open groups"
      subtitle="Sign in to create rooms, accept invites, and move between joined teams."
      returnTo={returnTo}
      loadingTitle="Loading groups..."
      loadingDescription="Fetching your memberships, invites, and public rooms."
    >
      <GroupsClient />
    </ProtectedRoute>
  );
}

export function GroupsClientOnly() {
  return (
    <Suspense
      fallback={
        <LoadingScreen title="Loading groups..." description="Fetching your memberships, invites, and public rooms." />
      }
    >
      <GroupsClientOnlyInner />
    </Suspense>
  );
}
