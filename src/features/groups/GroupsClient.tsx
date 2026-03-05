"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { ArrowLeft, Plus, UsersRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { LoadingScreen, PageContainer, PageHeader, PageShell } from "@/src/components/app/page-shell";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card";
import { Input } from "@/src/components/ui/input";
import { Switch } from "@/src/components/ui/switch";
import { LoginCard } from "@/src/features/auth/LoginCard";
import { useChatAuth } from "@/src/features/auth/useChatAuth";

const slugify = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);

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
  const [slugTouched, setSlugTouched] = useState(false);

  const myGroupIds = useMemo(() => new Set((myGroups ?? []).map((group) => group._id)), [myGroups]);
  const availablePublicGroups = useMemo(
    () => (publicGroups ?? []).filter((group) => !myGroupIds.has(group._id)),
    [publicGroups, myGroupIds]
  );
  const suggestedSlug = slugTouched ? slug : slugify(name);

  if (!auth.isReady) {
    return <LoadingScreen title="Loading groups..." description="Collecting memberships, invites, and discoverable rooms." />;
  }

  if (!auth.isLoggedIn) {
    return (
      <PageShell>
        <PageContainer className="flex min-h-[calc(100dvh-8rem)] items-center justify-center">
          <div className="w-full max-w-xl">
            <LoginCard
              title="Join groups"
              subtitle="Sign in once to create private rooms, accept invites, and browse public channels."
              onSubmit={async ({ name: loginName, password, profileFile }) => {
                const result = await auth.login({ name: loginName, password });

                if (profileFile) {
                  const uploadUrl = await generateUploadUrl({ token: result.token });
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
        </PageContainer>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <PageContainer>
        <PageHeader
          eyebrow="Groups"
          title="Manage your shared spaces"
          description="Create public or invite-only rooms, review pending invites, and jump into active teams quickly."
          action={
            <Button variant="outline" onClick={() => router.push("/chat")}>
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Back to chat
            </Button>
          }
        />

        <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
          <Card>
            <CardHeader>
              <Badge variant="secondary">Create</Badge>
              <CardTitle>Create a new group</CardTitle>
              <CardDescription>Public groups are discoverable. Private groups stay invite-only until you add members.</CardDescription>
            </CardHeader>
            <CardContent>
              <form
                className="grid gap-4 md:grid-cols-2"
                onSubmit={async (event) => {
                  event.preventDefault();
                  if (busy) return;
                  setBusy(true);
                  setError(null);
                  try {
                    const result = await createGroup({
                      token,
                      name: name.trim(),
                      slug: suggestedSlug || undefined,
                      description: description.trim() || undefined,
                      isPublic,
                    });
                    setName("");
                    setSlug("");
                    setSlugTouched(false);
                    setDescription("");
                    router.push(`/groups/${result.slug}`);
                  } catch (err) {
                    setError(err instanceof Error ? err.message : "Failed to create group");
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                <label className="space-y-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Name</span>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onBlur={() => {
                      if (!slugTouched && !slug) {
                        setSlug(slugify(name));
                      }
                    }}
                    placeholder="Design team"
                    required
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Slug</span>
                  <Input
                    value={slugTouched ? slug : suggestedSlug}
                    onChange={(e) => {
                      setSlugTouched(true);
                      setSlug(slugify(e.target.value));
                    }}
                    placeholder="design-team"
                  />
                </label>
                <label className="space-y-2 md:col-span-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Description</span>
                  <Input
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="What this group is for"
                  />
                </label>
                <div className="md:col-span-2 flex flex-col gap-4 rounded-[24px] border border-[color:var(--border-1)] bg-[color:rgba(216,228,243,0.82)] p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="text-sm font-medium text-[color:var(--text-1)]">Public group</div>
                    <div className="text-sm text-[color:var(--text-3)]">Anyone can join when enabled. Turn off to require an invite.</div>
                  </div>
                  <Switch checked={isPublic} onClick={() => setIsPublic((value) => !value)} />
                </div>
                <div className="md:col-span-2 flex flex-wrap items-center gap-3">
                  <Button type="submit" disabled={busy || !name.trim()}>
                    <Plus className="h-4 w-4" aria-hidden="true" />
                    {busy ? "Creating..." : "Create group"}
                  </Button>
                  {suggestedSlug ? <Badge variant="outline">/{suggestedSlug}</Badge> : null}
                </div>
                {error ? <div className="md:col-span-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}
              </form>
            </CardContent>
          </Card>

          <div className="grid gap-4">
            {invites && invites.length > 0 ? (
              <Card>
                <CardHeader>
                  <Badge variant="warning">Invites</Badge>
                  <CardTitle>Pending invites</CardTitle>
                  <CardDescription>Accept an invite to open the room immediately.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {invites.filter((invite): invite is NonNullable<typeof invite> => Boolean(invite)).map((invite) => (
                    <div key={invite._id} className="flex flex-col gap-3 rounded-[24px] border border-[color:var(--border-1)] bg-[color:rgba(216,228,243,0.82)] p-4 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <div className="text-sm font-semibold text-[color:var(--text-1)]">{invite.groupName}</div>
                        <div className="text-sm text-[color:var(--text-3)]">/{invite.groupSlug}</div>
                      </div>
                      <Button
                        variant="secondary"
                        onClick={async () => {
                          await joinGroup({ token, groupId: invite.groupId });
                          router.push(`/groups/${invite.groupSlug}`);
                        }}
                      >
                        Accept invite
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ) : null}

            <Card>
              <CardHeader>
                <Badge variant="outline">Overview</Badge>
                <CardTitle>Quick stats</CardTitle>
                <CardDescription>Track what you own, joined, and can discover.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
                <div className="rounded-[24px] border border-[color:var(--border-1)] bg-[color:rgba(216,228,243,0.86)] p-4">
                  <div className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--accent-text)]">My groups</div>
                  <div className="mt-2 text-3xl font-semibold text-[color:var(--text-1)]">{myGroups?.length ?? 0}</div>
                </div>
                <div className="rounded-[24px] border border-[color:var(--border-1)] bg-[color:rgba(216,228,243,0.86)] p-4">
                  <div className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--accent-text)]">Public rooms</div>
                  <div className="mt-2 text-3xl font-semibold text-[color:var(--text-1)]">{availablePublicGroups.length}</div>
                </div>
                <div className="rounded-[24px] border border-[color:var(--border-1)] bg-[color:rgba(216,228,243,0.86)] p-4">
                  <div className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--accent-text)]">Pending invites</div>
                  <div className="mt-2 text-3xl font-semibold text-[color:var(--text-1)]">{invites?.length ?? 0}</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <Badge variant="secondary">Joined</Badge>
              <CardTitle>My groups</CardTitle>
              <CardDescription>Open the rooms you already belong to.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {myGroups && myGroups.length > 0 ? (
                myGroups.map((group) => (
                  <button
                    key={group._id}
                    type="button"
                    onClick={() => router.push(`/groups/${group.slug}`)}
                    className="flex w-full items-center justify-between rounded-[24px] border border-[color:var(--border-1)] bg-[color:rgba(237,243,251,0.84)] px-4 py-4 text-left shadow-sm transition hover:border-[color:var(--border-2)] hover:bg-[color:rgba(244,248,253,0.96)]"
                  >
                    <div>
                      <div className="text-sm font-semibold text-[color:var(--text-1)]">{group.name}</div>
                      <div className="mt-1 text-sm text-[color:var(--text-3)]">{group.isPublic ? "Public" : "Private"} · {group.role}</div>
                    </div>
                    <Badge variant="outline">Open</Badge>
                  </button>
                ))
              ) : (
                <div className="rounded-[24px] border border-dashed border-[color:var(--border-1)] bg-[color:rgba(236,243,251,0.74)] px-4 py-6 text-sm text-[color:var(--text-3)]">No groups yet. Create one to get started.</div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Badge variant="secondary">Discover</Badge>
              <CardTitle>Public groups</CardTitle>
              <CardDescription>Browse open spaces you have not joined yet.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {availablePublicGroups.length > 0 ? (
                availablePublicGroups.map((group) => (
                  <div key={group._id} className="flex flex-col gap-3 rounded-[24px] border border-[color:var(--border-1)] bg-[color:rgba(237,243,251,0.84)] px-4 py-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="text-sm font-semibold text-[color:var(--text-1)]">{group.name}</div>
                      <div className="mt-1 text-sm text-[color:var(--text-3)]">/{group.slug}</div>
                    </div>
                    <Button
                      variant="secondary"
                      onClick={async () => {
                        await joinGroup({ token, groupId: group._id });
                        router.push(`/groups/${group.slug}`);
                      }}
                    >
                      <UsersRound className="h-4 w-4" aria-hidden="true" />
                      Join group
                    </Button>
                  </div>
                ))
              ) : (
                <div className="rounded-[24px] border border-dashed border-[color:var(--border-1)] bg-[color:rgba(236,243,251,0.74)] px-4 py-6 text-sm text-[color:var(--text-3)]">No public groups are available right now.</div>
              )}
            </CardContent>
          </Card>
        </div>
      </PageContainer>
    </PageShell>
  );
}
