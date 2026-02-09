import dynamic from "next/dynamic";

const GeneralChatClient = dynamic(
  () =>
    import("@/src/componnets/chat/GeneralChatClient").then(
      (m) => m.GeneralChatClient
    ),
  { ssr: false }
);

export default function ChatPage() {
  return <GeneralChatClient />;
}