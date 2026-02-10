"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { useRouter } from "next/navigation";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { LoginCard } from "@/src/features/auth/LoginCard";
import { useChatAuth } from "@/src/features/auth/useChatAuth";

export function GroupsClient() {
  const router = useRouter();
  const auth = useChatAuth();
  const token = auth.token ?? "";

  const generateUploadUrl = useMutation(api.chats.generateUploadUrl);
  const setMyProfilePicture = useMutation(api.users.setMyProfilePicture);
  const createGroup = useMutation(api.groups.createGroup);
  const joinGroup = useMutation(api.groups.joinGroup);

  const myGroups = useQuery(api.groups.listMyGroups, auth.isLoggedIn ? { token } : "skip");
  const publicGroups = useQuery(api.groups.listPublicGroups);
  const invites = useQuery(api.groups.listMyInvites, auth.isLoggedIn ? { token } : "skip");

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const myGroupIds = useMemo(() => new Set((myGroups ?? []).map((g) => g._id)), [myGroups]);
  const availablePublicGroups = useMemo(
    () => (publicGroups ?? []).filter((g) => !myGroupIds.has(g._id)),
    [publicGroups, myGroupIds]
  );

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
            title="Join groups"
            subtitle="Pick a username to access group chats."
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

  return (
    <main className="min-h-screen w-full theme-page p-4 sm:p-6">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-xs font-semibold tracking-widest theme-faint">GROUPS</div>
            <div className="text-2xl font-semibold theme-text">Manage your group chats</div>
          </div>
          <button
            type="button"
            onClick={() => router.push("/chat")}
            className="rounded-full border px-4 py-2 text-xs font-semibold theme-chip"
          >
            Back to chat
          </button>
        </header>

        <section className="rounded-2xl border theme-panel p-4 shadow backdrop-blur">
          <div className="text-sm font-semibold theme-text">Create a group</div>
          <p className="theme-muted mt-1 text-xs">
            Public groups can be joined by anyone. Private groups require an invite.
          </p>
          <form
            className="mt-3 grid gap-3 md:grid-cols-2"
            onSubmit={async (event) => {
              event.preventDefault();
              if (busy) return;
              setBusy(true);
              setError(null);
              try {
                const result = await createGroup({
                  token,
                  name,
                  slug: slug || undefined,
                  description: description || undefined,
                  isPublic,
                });
                setName("");
                setSlug("");
                setDescription("");
                router.push(`/groups/${result.slug}`);
              } catch (err) {
                setError(err instanceof Error ? err.message : "Failed to create group");
              } finally {
                setBusy(false);
              }
            }}
          >
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold tracking-widest theme-faint">NAME</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Design team"
                className="rounded-xl border px-3 py-2 text-sm theme-input"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold tracking-widest theme-faint">SLUG</label>
              <input
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="design-team"
                className="rounded-xl border px-3 py-2 text-sm theme-input"
              />
            </div>
            <div className="md:col-span-2 flex flex-col gap-2">
              <label className="text-xs font-semibold tracking-widest theme-faint">DESCRIPTION</label>
              <input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What this group is for"
                className="rounded-xl border px-3 py-2 text-sm theme-input"
              />
            </div>
            <div className="md:col-span-2 flex items-center gap-3">
              <label className="inline-flex items-center gap-2 text-sm font-semibold theme-text">
                <input
                  type="checkbox"
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                />
                Public group
              </label>
              <button
                type="submit"
                disabled={busy}
                className="rounded-xl bg-indigo-500 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {busy ? "Creating…" : "Create"}
              </button>
            </div>
            {error ? <div className="md:col-span-2 text-xs text-red-500">{error}</div> : null}
          </form>
        </section>

        {invites && invites.length > 0 ? (
          <section className="rounded-2xl border theme-panel p-4 shadow backdrop-blur">
            <div className="text-sm font-semibold theme-text">Invites</div>
            <div className="mt-3 grid gap-2">
              {invites.map((invite) => (
                <div
                  key={invite._id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border px-3 py-2 theme-chip"
                >
                  <div>
                    <div className="text-sm font-semibold theme-text">{invite.groupName}</div>
                    <div className="text-xs theme-muted">/{invite.groupSlug}</div>
                  </div>
                  <button
                    type="button"
                    onClick={async () => {
                      await joinGroup({ token, groupId: invite.groupId });
                      router.push(`/groups/${invite.groupSlug}`);
                    }}
                    className="rounded-full border px-3 py-1 text-xs font-semibold theme-chip"
                  >
                    Accept
                  </button>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        <section className="grid gap-3 md:grid-cols-2">
          <div className="rounded-2xl border theme-panel p-4 shadow backdrop-blur">
            <div className="text-sm font-semibold theme-text">My groups</div>
            <div className="mt-3 grid gap-2">
              {myGroups && myGroups.length > 0 ? (
                myGroups.map((group) => (
                  <button
                    key={group._id}
                    type="button"
                    onClick={() => router.push(`/groups/${group.slug}`)}
                    className="flex w-full items-center justify-between rounded-xl border px-3 py-2 text-left theme-chip"
                  >
                    <div>
                      <div className="text-sm font-semibold theme-text">{group.name}</div>
                      <div className="text-xs theme-muted">
                        {group.isPublic ? "Public" : "Private"} · {group.role}
                      </div>
                    </div>
                    <span className="text-xs font-semibold theme-accent">Open</span>
                  </button>
                ))
              ) : (
                <div className="text-xs theme-muted">No groups yet.</div>
              )}
            </div>
          </div>

          <div className="rounded-2xl border theme-panel p-4 shadow backdrop-blur">
            <div className="text-sm font-semibold theme-text">Public groups</div>
            <div className="mt-3 grid gap-2">
              {availablePublicGroups.length > 0 ? (
                availablePublicGroups.map((group) => (
                  <div
                    key={group._id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-xl border px-3 py-2 theme-chip"
                  >
                    <div>
                      <div className="text-sm font-semibold theme-text">{group.name}</div>
                      <div className="text-xs theme-muted">/{group.slug}</div>
                    </div>
                    <button
                      type="button"
                      onClick={async () => {
                        await joinGroup({ token, groupId: group._id });
                        router.push(`/groups/${group.slug}`);
                      }}
                      className="rounded-full border px-3 py-1 text-xs font-semibold theme-chip"
                    >
                      Join
                    </button>
                  </div>
                ))
              ) : (
                <div className="text-xs theme-muted">No public groups available.</div>
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
