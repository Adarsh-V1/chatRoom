"use client";

import dynamic from "next/dynamic";
import { LoadingScreen } from "@/src/components/app/page-shell";

const GeneralChatClient = dynamic(
  () => import("@/src/features/chat/GeneralChatClient").then((m) => m.GeneralChatClient),
  {
    ssr: false,
    loading: () => <LoadingScreen title="Loading chat..." description="Preparing the latest conversations and presence data." />,
  }
);

export function ChatClientOnly() {
  return <GeneralChatClient />;
}
