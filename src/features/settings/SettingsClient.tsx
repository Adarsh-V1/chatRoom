"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { LoginCard } from "@/src/features/auth/LoginCard";
import { useChatAuth } from "@/src/features/auth/useChatAuth";
import { ThemeToggle } from "@/src/features/theme/ThemeToggle";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

const SettingsClient = () => {
  const auth = useChatAuth();
  const generateUploadUrl = useMutation(api.chats.generateUploadUrl);
  const setMyProfilePicture = useMutation(api.users.setMyProfilePicture);
  const settings = useQuery(
    api.settings.getMySettings,
    auth.isLoggedIn ? { token: auth.token ?? "" } : "skip"
  );
  const updateSettings = useMutation(api.settings.updateMySettings);
  const setMutedUser = useMutation(api.users.setMutedUser);
  const users = useQuery(api.users.listUsers, auth.isLoggedIn ? undefined : "skip");
  const mutedUsers = useQuery(
    api.users.getMutedUsers,
    auth.isLoggedIn ? { token: auth.token ?? "" } : "skip"
  );
  const [exportNonce, setExportNonce] = useState(0);
  const exportData = useQuery(
    api.chats.exportChats,
    auth.isLoggedIn && exportNonce > 0
      ? { token: auth.token ?? "", limit: 2000 }
      : "skip"
  );

  const [userQuery, setUserQuery] = useState("");
  const [notificationError, setNotificationError] = useState<string | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);

  useEffect(() => {
    if (!exportData || exportNonce === 0) return;
    try {
      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `chat-export-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Export failed";
      setExportError(message);
    }
  }, [exportData, exportNonce]);

  const mutedSet = useMemo(
    () => new Set((mutedUsers ?? []).map((n) => n.toLowerCase())),
    [mutedUsers]
  );

  const filteredUsers = useMemo(() => {
    const q = userQuery.trim().toLowerCase();
    const list = (users ?? []).filter((u) => u !== auth.name);
    if (!q) return list;
    return list.filter((name) => name.toLowerCase().includes(q));
  }, [users, userQuery, auth.name]);

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
        <div className="mx-auto w-full max-w-5xl">
          <div className="mb-6">
            <h1 className="text-2xl font-semibold theme-text">Settings</h1>
            <p className="mt-2 text-sm theme-muted">
              Tune your experience and preferences here.
            </p>
          </div>

          <section className="rounded-2xl border theme-panel p-6 shadow backdrop-blur">
            <div className="text-sm font-semibold theme-text">Preferences</div>
            <div className="mt-4 flex flex-wrap gap-3">
              <ThemeToggle />
            </div>
            <p className="mt-4 text-xs theme-faint">
              Theme controls the overall look.
            </p>
          </section>

          <section className="mt-6 rounded-2xl border theme-panel p-6 shadow backdrop-blur">
            <div className="text-sm font-semibold theme-text">Notifications</div>
            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => {
                  if (!settings) return;
                  void updateSettings({
                    token: auth.token ?? "",
                    notificationSound: !settings.notificationSound,
                  });
                }}
                className="rounded-xl border px-3 py-2 text-xs font-semibold theme-chip"
              >
                Sound: {settings?.notificationSound ? "On" : "Off"}
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (!settings) return;
                  setNotificationError(null);
                  if (settings.desktopNotifications) {
                    void updateSettings({
                      token: auth.token ?? "",
                      desktopNotifications: false,
                    });
                    return;
                  }

                  if (typeof Notification === "undefined") {
                    setNotificationError("Desktop notifications are not supported.");
                    return;
                  }

                  const permission = await Notification.requestPermission();
                  if (permission !== "granted") {
                    setNotificationError("Notification permission denied.");
                    return;
                  }

                  void updateSettings({
                    token: auth.token ?? "",
                    desktopNotifications: true,
                  });
                }}
                className="rounded-xl border px-3 py-2 text-xs font-semibold theme-chip"
              >
                Desktop: {settings?.desktopNotifications ? "On" : "Off"}
              </button>
            </div>
            {notificationError ? (
              <div className="mt-3 text-xs text-rose-600">{notificationError}</div>
            ) : null}
          </section>

          <section className="mt-6 rounded-2xl border theme-panel p-6 shadow backdrop-blur">
            <div className="text-sm font-semibold theme-text">Chat appearance</div>
            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => {
                  const next = settings?.messageDensity === "compact" ? "comfortable" : "compact";
                  void updateSettings({ token: auth.token ?? "", messageDensity: next });
                }}
                className="rounded-xl border px-3 py-2 text-xs font-semibold theme-chip"
              >
                Density: {settings?.messageDensity ?? "comfortable"}
              </button>
              <div className="inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold theme-chip">
                <span>Font</span>
                <button
                  type="button"
                  onClick={() => {
                    const next = Math.max(0.9, Math.round(((settings?.fontScale ?? 1) - 0.1) * 10) / 10);
                    void updateSettings({ token: auth.token ?? "", fontScale: next });
                  }}
                  className="rounded-lg border px-2 py-1"
                >
                  -
                </button>
                <span>{settings?.fontScale ?? 1}</span>
                <button
                  type="button"
                  onClick={() => {
                    const next = Math.min(1.3, Math.round(((settings?.fontScale ?? 1) + 0.1) * 10) / 10);
                    void updateSettings({ token: auth.token ?? "", fontScale: next });
                  }}
                  className="rounded-lg border px-2 py-1"
                >
                  +
                </button>
              </div>
            </div>
          </section>

          <section className="mt-6 rounded-2xl border theme-panel p-6 shadow backdrop-blur">
            <div className="text-sm font-semibold theme-text">Privacy controls</div>
            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => {
                  if (!settings) return;
                  void updateSettings({
                    token: auth.token ?? "",
                    readReceipts: !settings.readReceipts,
                  });
                }}
                className="rounded-xl border px-3 py-2 text-xs font-semibold theme-chip"
              >
                Read receipts: {settings?.readReceipts ? "On" : "Off"}
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!settings) return;
                  void updateSettings({
                    token: auth.token ?? "",
                    typingIndicator: !settings.typingIndicator,
                  });
                }}
                className="rounded-xl border px-3 py-2 text-xs font-semibold theme-chip"
              >
                Typing indicator: {settings?.typingIndicator ? "On" : "Off"}
              </button>
            </div>
          </section>

          <section className="mt-6 rounded-2xl border theme-panel p-6 shadow backdrop-blur">
            <div className="text-sm font-semibold theme-text">Muted users</div>
            <div className="mt-3">
              <input
                value={userQuery}
                onChange={(e) => setUserQuery(e.target.value)}
                placeholder="Search users..."
                className="w-full rounded-xl border px-3 py-2 text-sm theme-input"
              />
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {filteredUsers.length > 0 ? (
                filteredUsers.map((name) => {
                  const isMuted = mutedSet.has(name.toLowerCase());
                  return (
                    <div
                      key={name}
                      className={
                        "flex items-center justify-between rounded-xl border px-3 py-2 text-xs font-semibold " +
                        (isMuted ? "theme-panel-strong" : "theme-chip")
                      }
                    >
                      <span className="truncate">{name}</span>
                      <button
                        type="button"
                        onClick={() => {
                          void setMutedUser({
                            token: auth.token ?? "",
                            otherName: name,
                            muted: !isMuted,
                          });
                        }}
                        className="rounded-lg border px-2 py-1 text-[10px] font-semibold"
                      >
                        {isMuted ? "Unmute" : "Mute"}
                      </button>
                    </div>
                  );
                })
              ) : (
                <div className="text-xs theme-faint">No matching users.</div>
              )}
            </div>
          </section>

          <section className="mt-6 rounded-2xl border theme-panel p-6 shadow backdrop-blur">
            <div className="text-sm font-semibold theme-text">Data tools</div>
            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={async () => {
                  setExportError(null);
                  setExportNonce(Date.now());
                }}
                className="rounded-xl border px-3 py-2 text-xs font-semibold theme-chip"
              >
                Export chat history
              </button>
              <button
                type="button"
                onClick={auth.logout}
                className="rounded-xl border px-3 py-2 text-xs font-semibold theme-chip"
              >
                Clear local session
              </button>
            </div>
            {exportError ? (
              <div className="mt-3 text-xs text-rose-600">{exportError}</div>
            ) : null}
          </section>

          <section className="mt-6 rounded-2xl border theme-panel p-6 shadow backdrop-blur">
            <div className="text-sm font-semibold theme-text">Accessibility</div>
            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => {
                  if (!settings) return;
                  void updateSettings({
                    token: auth.token ?? "",
                    reducedMotion: !settings.reducedMotion,
                  });
                }}
                className="rounded-xl border px-3 py-2 text-xs font-semibold theme-chip"
              >
                Reduced motion: {settings?.reducedMotion ? "On" : "Off"}
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!settings) return;
                  void updateSettings({
                    token: auth.token ?? "",
                    highContrast: !settings.highContrast,
                  });
                }}
                className="rounded-xl border px-3 py-2 text-xs font-semibold theme-chip"
              >
                High contrast: {settings?.highContrast ? "On" : "Off"}
              </button>
            </div>
          </section>

          <section className="mt-6 rounded-2xl border theme-panel p-6 shadow backdrop-blur">
            <div className="text-sm font-semibold theme-text">Media</div>
            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => {
                  if (!settings) return;
                  void updateSettings({
                    token: auth.token ?? "",
                    autoPlayGifs: !settings.autoPlayGifs,
                  });
                }}
                className="rounded-xl border px-3 py-2 text-xs font-semibold theme-chip"
              >
                Auto-play GIFs: {settings?.autoPlayGifs ? "On" : "Off"}
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!settings) return;
                  void updateSettings({
                    token: auth.token ?? "",
                    autoDownloadFiles: !settings.autoDownloadFiles,
                  });
                }}
                className="rounded-xl border px-3 py-2 text-xs font-semibold theme-chip"
              >
                Auto-download files: {settings?.autoDownloadFiles ? "On" : "Off"}
              </button>
            </div>
          </section>
        </div>
      ) : (
        <div className="mx-auto flex min-h-[calc(100vh-2rem)] w-full max-w-md items-center justify-center">
          <LoginCard
            title="Open settings"
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

export { SettingsClient };
