"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { useRouter } from "next/navigation";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { ChatFeed } from "@/src/features/chat/chatFeed";
import { ChatForm } from "@/src/features/chat/chatForm";
import { LoginCard } from "@/src/features/auth/LoginCard";
import { useChatAuth } from "@/src/features/auth/useChatAuth";

const GROUP_ROOM_PREFIX = "group:";

type Props = {
  slug: string;
};

export function GroupRoomClient({ slug }: Props) {
  const router = useRouter();
  const auth = useChatAuth();
  const token = auth.token ?? "";

  const generateUploadUrl = useMutation(api.chats.generateUploadUrl);
  const setMyProfilePicture = useMutation(api.users.setMyProfilePicture);
  const joinGroup = useMutation(api.groups.joinGroup);
  const leaveGroup = useMutation(api.groups.leaveGroup);
  const inviteMember = useMutation(api.groups.inviteMember);

  const group = useQuery(api.groups.getGroupBySlug, { slug });
  const membership = useQuery(
    api.groups.getMyMembership,
    auth.isLoggedIn && group ? { token, groupId: group._id } : "skip"
  );
  const invite = useQuery(
    api.groups.getMyInviteForGroup,
    auth.isLoggedIn && group ? { token, groupId: group._id } : "skip"
  );
  const members = useQuery(
    api.groups.listGroupMembers,
    auth.isLoggedIn && group ? { token, groupId: group._id } : "skip"
  );

  const [inviteName, setInviteName] = useState("");
  const [inviteStatus, setInviteStatus] = useState<string | null>(null);

  const room = useMemo(
    () => `${GROUP_ROOM_PREFIX}${group?.slug ?? slug}`,
    [group?.slug, slug]
  );
  const canJoin = Boolean(group && (group.isPublic || invite));
  const isOwner = membership?.role === "owner";

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

  if (!auth.isLoggedIn) {
    return (
      <main className="min-h-screen w-full theme-page p-4 sm:p-6">
        <div className="mx-auto flex min-h-[calc(100vh-2rem)] w-full max-w-md items-center justify-center">
          <LoginCard
            title="Join group"
            subtitle="Sign in to access group chats."
            onSubmit={async ({ name: loginName, password, profileFile }) => {
              const result = await auth.login({ name: loginName, password });

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
      </main>
    );
  }

  if (group === null) {
    return (
      <main className="min-h-screen w-full theme-page p-4 sm:p-6">
        <div className="mx-auto flex min-h-[calc(100vh-2rem)] w-full max-w-md items-center justify-center">
          <div className="w-full rounded-2xl border theme-panel p-8 shadow backdrop-blur">
            <div className="text-base font-semibold theme-text">Group not found</div>
            <p className="theme-muted mt-2 text-sm">Check the URL or return to groups.</p>
            <button
              type="button"
              onClick={() => router.push("/groups")}
              className="mt-4 rounded-xl border px-4 py-2 text-sm font-semibold theme-chip"
            >
              Back to groups
            </button>
          </div>
        </div>
      </main>
    );
  }

  if (!group) {
    return (
      <main className="min-h-screen w-full theme-page p-4 sm:p-6">
        <div className="mx-auto flex min-h-[calc(100vh-2rem)] w-full max-w-md items-center justify-center">
          <div className="w-full rounded-2xl border theme-panel p-8 shadow backdrop-blur">
            <div className="text-base font-semibold theme-text">Loading group…</div>
          </div>
        </div>
      </main>
    );
  }

  if (!membership) {
    return (
      <main className="min-h-screen w-full theme-page p-4 sm:p-6">
        <div className="mx-auto flex min-h-[calc(100vh-2rem)] w-full max-w-md items-center justify-center">
          <div className="w-full rounded-2xl border theme-panel p-8 shadow backdrop-blur">
            <div className="text-base font-semibold theme-text">{group.name}</div>
            <div className="theme-muted mt-1 text-sm">/{group.slug}</div>
            {group.description ? (
              <p className="theme-muted mt-2 text-sm">{group.description}</p>
            ) : null}
            <div className="mt-3 text-xs font-semibold theme-faint">
              {group.isPublic ? "Public group" : "Private group"}
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => router.push("/groups")}
                className="rounded-xl border px-4 py-2 text-sm font-semibold theme-chip"
              >
                Back
              </button>
              <button
                type="button"
                disabled={!canJoin}
                onClick={async () => {
                  await joinGroup({ token, groupId: group._id });
                }}
                className="rounded-xl bg-indigo-500 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {canJoin ? "Join group" : "Invite required"}
              </button>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen w-full theme-page p-3 sm:p-6">
      <div className="mx-auto flex h-[calc(100vh-1.5rem)] w-full max-w-6xl flex-col gap-3 sm:h-[calc(100vh-3rem)] sm:gap-4 lg:flex-row">
        <section className="flex min-h-0 flex-1 flex-col rounded-2xl border theme-panel p-3 shadow backdrop-blur">
          <header className="mb-3 flex flex-wrap items-center justify-between gap-2 px-2">
            <div>
              <div className="text-xs font-semibold tracking-widest theme-faint">GROUP CHAT</div>
              <div className="text-lg font-semibold theme-text">{group.name}</div>
              <div className="text-xs theme-muted">/{group.slug}</div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => router.push("/groups")}
                className="rounded-full border px-3 py-2 text-xs font-semibold theme-chip"
              >
                Groups
              </button>
              {!isOwner ? (
                <button
                  type="button"
                  onClick={async () => {
                    await leaveGroup({ token, groupId: group._id });
                    router.push("/groups");
                  }}
                  className="rounded-full border px-3 py-2 text-xs font-semibold theme-chip"
                >
                  Leave
                </button>
              ) : (
                <div className="rounded-full border px-3 py-2 text-xs font-semibold theme-chip">
                  Owner
                </div>
              )}
            </div>
          </header>

          <ChatFeed currentUser={auth.name ?? ""} room={room} token={token} />
          <ChatForm token={token} room={room} />
        </section>

        <aside className="w-full rounded-2xl border theme-panel p-4 shadow backdrop-blur lg:w-72">
          <div className="text-sm font-semibold theme-text">Members</div>
          <div className="mt-2 grid gap-2">
            {members && members.length > 0 ? (
              members.map((member) => (
                <div
                  key={member.userId}
                  className="flex items-center justify-between rounded-xl border px-3 py-2 text-xs font-semibold theme-chip"
                >
                  <span>{member.name}</span>
                  <span className="theme-muted">{member.role}</span>
                </div>
              ))
            ) : (
              <div className="text-xs theme-muted">No members yet.</div>
            )}
          </div>

          {isOwner ? (
            <div className="mt-4">
              <div className="text-xs font-semibold tracking-widest theme-faint">INVITE</div>
              <div className="mt-2 flex flex-col gap-2">
                <input
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  placeholder="Username"
                  className="rounded-xl border px-3 py-2 text-sm theme-input"
                />
                <button
                  type="button"
                  onClick={async () => {
                    if (!inviteName.trim()) return;
                    setInviteStatus(null);
                    try {
                      const result = await inviteMember({
                        token,
                        groupId: group._id,
                        userName: inviteName,
                      });
                      setInviteStatus(result.invited ? "Invite sent" : "Already invited");
                      setInviteName("");
                    } catch (err) {
                      setInviteStatus(err instanceof Error ? err.message : "Invite failed");
                    }
                  }}
                  className="rounded-xl border px-3 py-2 text-xs font-semibold theme-chip"
                >
                  Send invite
                </button>
                {inviteStatus ? (
                  <div className="text-xs theme-muted">{inviteStatus}</div>
                ) : null}
              </div>
            </div>
          ) : null}
        </aside>
      </div>
    </main>
  );
}
