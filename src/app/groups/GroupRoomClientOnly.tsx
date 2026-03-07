"use client";

import { Suspense } from "react";
import dynamic from "next/dynamic";
import { usePathname, useSearchParams } from "next/navigation";
import { LoadingScreen } from "@/src/components/app/page-shell";
import { ProtectedRoute } from "@/src/features/auth/ProtectedRoute";

type Props = {
  slug: string;
};

const GroupRoomClient = dynamic(
  () => import("@/src/features/groups/GroupRoomClient").then((m) => m.GroupRoomClient),
  {
    ssr: false,
    loading: () => <LoadingScreen title="Loading group room..." description="Preparing members, messages, and permissions." />,
  }
);

function GroupRoomClientOnlyInner({ slug }: Props) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const qs = searchParams.toString();
  const returnTo = `${pathname}${qs ? `?${qs}` : ""}`;

  return (
    <ProtectedRoute
      title="Open group room"
      subtitle="Sign in to enter the room, review members, and keep call state tied to the group."
      returnTo={returnTo}
      loadingTitle="Loading group room..."
      loadingDescription="Preparing members, messages, and permissions."
    >
      <GroupRoomClient slug={slug} />
    </ProtectedRoute>
  );
}

export function GroupRoomClientOnly({ slug }: Props) {
  return (
    <Suspense
      fallback={
        <LoadingScreen title="Loading group room..." description="Preparing members, messages, and permissions." />
      }
    >
      <GroupRoomClientOnlyInner slug={slug} />
    </Suspense>
  );
}
