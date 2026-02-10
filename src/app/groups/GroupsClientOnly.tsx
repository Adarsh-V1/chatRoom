"use client";

import dynamic from "next/dynamic";

const GroupsClient = dynamic(
  () => import("@/src/features/groups/GroupsClient").then((m) => m.GroupsClient),
  {
    ssr: false,
    loading: () => (
      <main className="min-h-screen w-full theme-page p-4 sm:p-6">
        <div className="mx-auto flex min-h-[calc(100vh-2rem)] w-full max-w-md items-center justify-center">
          <div className="w-full rounded-2xl border theme-card p-8 shadow backdrop-blur">
            <div className="text-sm font-semibold theme-muted">Loading…</div>
          </div>
        </div>
      </main>
    ),
  }
);

export function GroupsClientOnly() {
  return <GroupsClient />;
}
