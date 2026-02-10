"use client";

import { useMutation } from "convex/react";
import { useRouter } from "next/navigation";
import { UserListSidebar } from "@/src/features/chat/UserListSidebar";
import { LoginCard } from "@/src/features/auth/LoginCard";
import { useChatAuth } from "@/src/features/auth/useChatAuth";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

const UsersClient = () => {
  const router = useRouter();

  const auth = useChatAuth();
  const generateUploadUrl = useMutation(api.chats.generateUploadUrl);
  const setMyProfilePicture = useMutation(api.users.setMyProfilePicture);

  const username = auth.name ?? "";
  const token = auth.token ?? "";

  if (!auth.isReady) {
    return (
      <main className="min-h-screen w-full theme-page p-4 sm:p-6">
        <div className="mx-auto flex min-h-[calc(100vh-2rem)] w-full max-w-md items-center justify-center">
          <div className="w-full rounded-2xl border theme-card p-8 shadow backdrop-blur">
            <div className="text-sm font-semibold theme-muted">Loading…</div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen w-full theme-page p-4 sm:p-6">
      {auth.isLoggedIn ? (
        <div className="mx-auto w-full max-w-4xl">
          <UserListSidebar
            currentUser={username}
            token={token}
            onSelectUser={(user) => {
              if (!user || user === username) return;
              const room = [username.toLowerCase(), user.toLowerCase()].sort().join("-");
              router.push(`/chat/${room}`);
            }}
            title="USERS"
            subtitle="Click a name to open a direct chat."
            searchPlaceholder="Search users..."
            emptyLabel="No matching users."
          />
        </div>
      ) : (
        <div className="mx-auto flex min-h-[calc(100vh-2rem)] w-full max-w-md items-center justify-center">
          <LoginCard
            title="Browse users"
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

export { UsersClient };
