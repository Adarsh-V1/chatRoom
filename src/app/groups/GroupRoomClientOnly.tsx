"use client";

import dynamic from "next/dynamic";

type Props = {
  slug: string;
};

const GroupRoomClient = dynamic(
  () => import("@/src/features/groups/GroupRoomClient").then((m) => m.GroupRoomClient),
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

export function GroupRoomClientOnly({ slug }: Props) {
  return <GroupRoomClient slug={slug} />;
}
