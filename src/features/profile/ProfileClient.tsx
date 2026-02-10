"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { LoginCard } from "@/src/features/auth/LoginCard";
import { useChatAuth } from "@/src/features/auth/useChatAuth";
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

  const displayName = me?.name ?? name ?? "";

  useEffect(() => {
    if (me?.name) {
      setName(me.name);
    }
  }, [me?.name]);

  const canSave = useMemo(() => {
    const trimmed = name.trim();
    if (!trimmed) return false;
    if (saving) return false;
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
        const uploadUrl = await generateUploadUrl({});
        const res = await fetch(uploadUrl, {
          method: "POST",
          headers: {
            "Content-Type": profileFile.type || "application/octet-stream",
          },
          body: profileFile,
        });

        if (!res.ok) throw new Error("Upload failed");
        const json = (await res.json()) as { storageId: string };
        await setMyProfilePicture({
          token,
          storageId: json.storageId as Id<"_storage">,
        });
        setProfileFile(null);
      }

      setSuccess("Profile updated");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to update profile";
      setError(message);
    } finally {
      setSaving(false);
    }
  };

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
          <div className="mb-6">
            <h1 className="text-2xl font-semibold theme-text">Profile</h1>
            <p className="mt-2 text-sm theme-muted">
              Update your profile details and photo.
            </p>
          </div>

          <section className="rounded-2xl border theme-panel p-6 shadow backdrop-blur">
            <div className="flex flex-wrap items-center gap-4">
              <Avatar name={displayName || "You"} url={me?.profilePictureUrl} size="lg" />
              <div className="min-w-0">
                <div className="text-sm font-semibold theme-text">Signed in as</div>
                <div className="truncate text-lg font-bold theme-text">
                  {displayName}
                </div>
              </div>
            </div>

            <label className="mt-6 block">
              <div className="text-xs font-semibold tracking-widest theme-faint">DISPLAY NAME</div>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name…"
                className="mt-2 w-full rounded-xl border px-4 py-3 focus:outline-none focus:ring-2 focus:ring-cyan-400/40 theme-input"
              />
            </label>

            <ProfilePhotoPicker
              nameForFallback={displayName || "You"}
              file={profileFile}
              onFileChange={setProfileFile}
            />

            {error ? (
              <div className="mt-4 rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
                {error}
              </div>
            ) : null}
            {success ? (
              <div className="mt-4 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
                {success}
              </div>
            ) : null}

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={saveProfile}
                disabled={!canSave}
                className="rounded-xl bg-indigo-500 px-5 py-2.5 text-sm font-semibold text-white shadow hover:bg-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/70 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? "Saving…" : "Save changes"}
              </button>
              <button
                type="button"
                onClick={auth.logout}
                className="rounded-xl border px-4 py-2.5 text-xs font-semibold theme-chip"
              >
                Sign out
              </button>
            </div>
          </section>
        </div>
      ) : (
        <div className="mx-auto flex min-h-[calc(100vh-2rem)] w-full max-w-md items-center justify-center">
          <LoginCard
            title="Open profile"
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

export { ProfileClient };
