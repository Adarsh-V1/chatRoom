"use client";

import { Suspense } from "react";
import dynamic from "next/dynamic";
import { usePathname, useSearchParams } from "next/navigation";
import { LoadingScreen } from "@/src/components/app/page-shell";
import { ProtectedRoute } from "@/src/features/auth/ProtectedRoute";

const ProfileClient = dynamic(() => import("@/src/features/profile/ProfileClient").then((m) => m.ProfileClient), {
  ssr: false,
  loading: () => <LoadingScreen title="Loading profile..." description="Preparing your account settings and avatar." />,
});

function ProfileClientOnlyInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const qs = searchParams.toString();
  const returnTo = `${pathname}${qs ? `?${qs}` : ""}`;

  return (
    <ProtectedRoute
      title="Open account"
      subtitle="Sign in to update your profile, resume from your last workspace context, and manage account details."
      returnTo={returnTo}
      loadingTitle="Loading account..."
      loadingDescription="Preparing your account settings and avatar."
    >
      <ProfileClient />
    </ProtectedRoute>
  );
}

export function ProfileClientOnly() {
  return (
    <Suspense
      fallback={
        <LoadingScreen title="Loading account..." description="Preparing your account settings and avatar." />
      }
    >
      <ProfileClientOnlyInner />
    </Suspense>
  );
}
