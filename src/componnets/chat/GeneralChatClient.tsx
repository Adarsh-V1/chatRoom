"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { ChatFeed } from "./chatFeed";
import { ChatForm } from "./chatForm";
import { UserListSidebar } from "./UserListSidebar";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { LoginCard } from "@/src/componnets/auth/LoginCard";
import { useChatAuth } from "@/src/componnets/auth/useChatAuth";
import { OnlineAs } from "@/src/componnets/chat/OnlineAs";

const GeneralChatClient = () => {
  const [selectedUser, setSelectedUser] = useState<string | null>(null);

  const auth = useChatAuth();
  const generateUploadUrl = useMutation(api.chats.generateUploadUrl);
  const setMyProfilePicture = useMutation(api.users.setMyProfilePicture);

  const username = auth.name ?? "";
  const token = auth.token ?? "";

  const chatRoom =
    selectedUser && selectedUser !== username
      ? [username.toLowerCase(), selectedUser.toLowerCase()].sort().join("-")
      : "general";

  return (
    <main className="min-h-screen w-full bg-linear-to-br from-slate-950 via-indigo-950 to-cyan-950 p-4 sm:p-6">
      {auth.isLoggedIn ? (
        <div className="mx-auto flex w-full max-w-none flex-col gap-4 md:flex-row">
          <UserListSidebar
            currentUser={username}
            onSelectUser={(user) => setSelectedUser(user === username ? null : user)}
          />
          <section className="flex h-[calc(100vh-3rem)] flex-1 flex-col rounded-2xl border border-white/10 bg-slate-950/40 p-4 shadow backdrop-blur">
            <header className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div>
                <div className="text-xs font-semibold tracking-widest text-slate-300/80">
                  ONLINE AS
                </div>
                <OnlineAs token={token} />
              </div>
              <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-100 backdrop-blur">
                {selectedUser && selectedUser !== username ? (
                  <span>
                    Direct: <span className="text-indigo-200">{selectedUser}</span>
                  </span>
                ) : (
                  <span>
                    Room: <span className="text-indigo-200">general</span>
                  </span>
                )}
              </div>
            </header>

            <ChatFeed currentUser={username} room={chatRoom} />
            <ChatForm token={token} room={chatRoom} />
          </section>
        </div>
      ) : (
        <div className="mx-auto flex min-h-[calc(100vh-2rem)] w-full max-w-md items-center justify-center">
          <LoginCard
            title="Enter the lobby"
            subtitle="Pick a username, then use the same 4–5 letter password to come back." 
            onSubmit={async ({ name, password, profileFile }) => {
              const result = await auth.login({ name, password });

              if (profileFile) {
                const uploadUrl = await generateUploadUrl({});
                const res = await fetch(uploadUrl, {
                  method: "POST",
                  headers: {
                    "Content-Type": profileFile.type || "application/octet-stream",
                  },
                  body: profileFile,
                });
                if (res.ok) {
                  const json = (await res.json()) as { storageId: string };
                  await setMyProfilePicture({
                    token: result.token,
                    storageId: json.storageId as Id<"_storage">,
                  });
                }
              }
            }}
          />
        </div>
      )}
    </main>
  );
};

export { GeneralChatClient };
