"use client";

import dynamic from "next/dynamic";

type Props = {
  room: string;
};

const RoomChatClient = dynamic(
  () =>
    import("@/src/features/chat/RoomChatClient").then((m) => m.RoomChatClient),
  {
    ssr: false,
    loading: () => (
      <main className="min-h-screen w-full bg-linear-to-br from-slate-950 via-indigo-950 to-cyan-950 p-4 sm:p-6">
        <div className="mx-auto flex min-h-[calc(100vh-2rem)] w-full max-w-md items-center justify-center">
          <div className="w-full rounded-2xl border border-white/10 bg-slate-950/50 p-8 shadow backdrop-blur">
            <div className="text-sm font-semibold text-slate-200">Loading…</div>
          </div>
        </div>
      </main>
    ),
  }
);

export function RoomClientOnly({ room }: Props) {
  return <RoomChatClient room={room} />;
}
