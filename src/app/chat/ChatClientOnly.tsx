"use client";

import { Suspense } from "react";
import dynamic from "next/dynamic";
import { usePathname, useSearchParams } from "next/navigation";
import { LoadingScreen } from "@/src/components/app/page-shell";
import { ProtectedRoute } from "@/src/features/auth/ProtectedRoute";
import { sanitizeReturnTo } from "@/src/features/auth/returnTo";

const WorkspaceHomeClient = dynamic(
  () => import("@/src/features/workspace/WorkspaceHomeClient").then((m) => m.WorkspaceHomeClient),
  {
    ssr: false,
    loading: () => <LoadingScreen title="Loading inbox..." description="Preparing the latest conversations and presence data." />,
  }
);

function ChatClientOnlyInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const qs = searchParams.toString();
  const requestedReturnTo = sanitizeReturnTo(searchParams.get("returnTo"));
  const returnTo = requestedReturnTo ?? `${pathname}${qs ? `?${qs}` : ""}`;

  return (
    <ProtectedRoute
      title="Open your inbox"
      subtitle="Sign in once to open the shared workspace, direct threads, groups, and active calls."
      returnTo={returnTo}
      loadingTitle="Loading inbox..."
      loadingDescription="Preparing the latest conversations and presence data."
    >
      <WorkspaceHomeClient />
    </ProtectedRoute>
  );
}

export function ChatClientOnly() {
  return (
    <Suspense
      fallback={
        <LoadingScreen
          title="Loading inbox..."
          description="Preparing the latest conversations and presence data."
        />
      }
    >
      <ChatClientOnlyInner />
    </Suspense>
  );
}
