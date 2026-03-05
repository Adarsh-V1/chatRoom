"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { LogOut, Save } from "lucide-react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { LoadingScreen, PageContainer, PageHeader, PageShell } from "@/src/components/app/page-shell";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card";
import { Input } from "@/src/components/ui/input";
import { LoginCard } from "@/src/features/auth/LoginCard";
import { useChatAuth } from "@/src/features/auth/useChatAuth";
import { useAvatarPreview } from "@/src/features/auth/useAvatarPreview";
import { ProfilePhotoPicker } from "@/src/features/profile/ProfilePhotoPicker";
import { Avatar } from "@/src/features/ui/Avatar";

const ProfileClient = () => {
  const auth = useChatAuth();
  const generateUploadUrl = useMutation(api.chats.generateUploadUrl);
  const setMyProfilePicture = useMutation(api.users.setMyProfilePicture);
  const updateMyName = useMutation(api.users.updateMyName);

  const token = auth.token ?? "";
  const me = useQuery(api.users.getMe, auth.isLoggedIn ? { token } : "skip");

  const [name, setName] = useState("");
  const [profileFile, setProfileFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const previewUrl = useAvatarPreview(profileFile);

  const displayName = me?.name ?? name ?? "";

  useEffect(() => {
    if (me?.name) {
      setName(me.name);
    }
  }, [me?.name]);

  const canSave = useMemo(() => {
    const trimmed = name.trim();
    if (!trimmed || saving) return false;
    return trimmed !== (me?.name ?? "").trim() || Boolean(profileFile);
  }, [name, me?.name, profileFile, saving]);

  const saveProfile = async () => {
    if (!auth.isLoggedIn) return;
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Name is required");
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      if (trimmed !== (me?.name ?? "").trim()) {
        await updateMyName({ token, name: trimmed });
      }

      if (profileFile) {
        const uploadUrl = await generateUploadUrl({ token });
        const res = await fetch(uploadUrl, {
          method: "POST",
          headers: {
            "Content-Type": profileFile.type || "application/octet-stream",
          },
          body: profileFile,
        });

        if (!res.ok) throw new Error("Upload failed");
        const json = (await res.json()) as { storageId: string };
        await setMyProfilePicture({ token, storageId: json.storageId as Id<"_storage"> });
        setProfileFile(null);
      }

      setSuccess("Profile updated successfully.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  if (!auth.isReady) {
    return <LoadingScreen title="Loading profile..." description="Fetching your current account details and avatar." />;
  }

  if (!auth.isLoggedIn) {
    return (
      <PageShell>
        <PageContainer className="flex min-h-[calc(100dvh-8rem)] items-center justify-center">
          <div className="w-full max-w-xl">
            <LoginCard
              title="Open profile"
              subtitle="Sign in to update your display name and profile photo across chat, groups, and calls."
              onSubmit={async ({ name, password, profileFile }) => {
                const result = await auth.login({ name, password });

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
          eyebrow="Profile"
          title="Account details"
          description="Keep your display name and avatar current so chat, groups, and calls stay recognizable across devices."
          action={<Badge variant="secondary">Synced locally</Badge>}
        />

        <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
          <Card>
            <CardHeader>
              <CardTitle>Identity</CardTitle>
              <CardDescription>Changes apply immediately to your message bubbles, member lists, and active call presence.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap items-center gap-4 rounded-[28px] border border-[color:var(--border-1)] bg-[color:rgba(216,228,243,0.82)] p-4">
                <Avatar name={displayName || "You"} url={me?.profilePictureUrl} size="lg" className="h-16 w-16 rounded-[24px]" />
                <div className="min-w-0">
                  <div className="text-sm font-medium text-[color:var(--text-3)]">Signed in as</div>
                  <div className="truncate text-2xl font-semibold tracking-tight text-[color:var(--text-1)]">{displayName}</div>
                </div>
              </div>

              <label className="mt-6 block space-y-2">
                <span className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Display name</span>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
              </label>

              <ProfilePhotoPicker nameForFallback={displayName || "You"} file={profileFile} onFileChange={setProfileFile} />

              {error ? <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}
              {success ? <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{success}</div> : null}

              <div className="mt-6 flex flex-wrap items-center gap-3">
                <Button onClick={saveProfile} disabled={!canSave}>
                  <Save className="h-4 w-4" aria-hidden="true" />
                  {saving ? "Saving..." : "Save changes"}
                </Button>
                <Button variant="outline" onClick={auth.logout}>
                  <LogOut className="h-4 w-4" aria-hidden="true" />
                  Sign out
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Badge variant="outline">Preview</Badge>
              <CardTitle>How others see you</CardTitle>
              <CardDescription>This keeps your visual identity consistent across chat, groups, and call tiles.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-[28px] border border-[color:var(--border-1)] bg-[color:rgba(237,243,251,0.84)] p-4 shadow-sm">
                <div className="flex items-start gap-3">
                  <Avatar name={displayName || "You"} url={previewUrl ?? me?.profilePictureUrl} size="md" />
                  <div className="min-w-0 rounded-[24px] border border-[color:var(--border-1)] bg-[color:rgba(216,228,243,0.82)] px-4 py-3">
                    <div className="text-sm font-semibold text-[color:var(--text-1)]">{displayName || "You"}</div>
                    <div className="mt-1 text-sm leading-6 text-[color:var(--text-2)]">This is how your profile appears beside a normal chat message.</div>
                  </div>
                </div>
              </div>
              <div className="rounded-[28px] border border-[color:var(--border-1)] bg-[color:rgba(216,228,243,0.82)] p-4 text-sm text-[color:var(--text-2)]">
                Use a short, recognizable display name. Clear photos with centered framing work best in the sidebar and call layout.
              </div>
            </CardContent>
          </Card>
        </div>
      </PageContainer>
    </PageShell>
  );
};

export { ProfileClient };
