"use client";

import { Suspense } from "react";
import dynamic from "next/dynamic";
import { usePathname, useSearchParams } from "next/navigation";
import { LoadingScreen } from "@/src/components/app/page-shell";
import { ProtectedRoute } from "@/src/features/auth/ProtectedRoute";

const SettingsClient = dynamic(
  () => import("@/src/features/settings/SettingsClient").then((m) => m.SettingsClient),
  {
    ssr: false,
    loading: () => <LoadingScreen title="Loading settings..." description="Fetching your personal preferences and controls." />,
  }
);

function SettingsClientOnlyInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const qs = searchParams.toString();
  const returnTo = `${pathname}${qs ? `?${qs}` : ""}`;

  return (
    <ProtectedRoute
      title="Open settings"
      subtitle="Sign in to manage notifications, accessibility, privacy, and workspace preferences."
      returnTo={returnTo}
      loadingTitle="Loading settings..."
      loadingDescription="Fetching your personal preferences and controls."
    >
      <SettingsClient />
    </ProtectedRoute>
  );
}

export function SettingsClientOnly() {
  return (
    <Suspense
      fallback={
        <LoadingScreen title="Loading settings..." description="Fetching your personal preferences and controls." />
      }
    >
      <SettingsClientOnlyInner />
    </Suspense>
  );
}
