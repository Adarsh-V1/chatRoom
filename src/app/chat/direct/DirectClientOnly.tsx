"use client";

import { Suspense } from "react";
import dynamic from "next/dynamic";
import { usePathname, useSearchParams } from "next/navigation";

import { LoadingScreen } from "@/src/components/app/page-shell";
import { ProtectedRoute } from "@/src/features/auth/ProtectedRoute";

type Props = {
  user: string;
};

const DirectThreadClient = dynamic(
  () => import("@/src/features/chat/DirectThreadClient").then((m) => m.DirectThreadClient),
  {
    ssr: false,
    loading: () => (
      <LoadingScreen
        title="Loading direct thread..."
        description="Preparing the dedicated direct-message route and presence data."
      />
    ),
  }
);

function DirectClientOnlyInner({ user }: Props) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const qs = searchParams.toString();
  const returnTo = `${pathname}${qs ? `?${qs}` : ""}`;

  return (
    <ProtectedRoute
      title="Open direct thread"
      subtitle="Sign in to continue into the dedicated conversation route for this teammate."
      returnTo={returnTo}
      loadingTitle="Loading direct thread..."
      loadingDescription="Preparing the dedicated direct-message route and presence data."
    >
      <DirectThreadClient user={user} />
    </ProtectedRoute>
  );
}

export function DirectClientOnly({ user }: Props) {
  return (
    <Suspense
      fallback={
        <LoadingScreen
          title="Loading direct thread..."
          description="Preparing the dedicated direct-message route and presence data."
        />
      }
    >
      <DirectClientOnlyInner user={user} />
    </Suspense>
  );
}
