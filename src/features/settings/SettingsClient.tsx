"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { Download, Minus, MoonStar, Plus, Volume2 } from "lucide-react";
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

function SettingRow({
  label,
  description,
  control,
}: {
  label: string;
  description: string;
  control: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-[24px] border border-[color:var(--border-1)] bg-[color:rgba(216,228,243,0.82)] p-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <div className="text-sm font-medium text-[color:var(--text-1)]">{label}</div>
        <div className="text-sm text-[color:var(--text-3)]">{description}</div>
      </div>
      <div className="shrink-0">{control}</div>
    </div>
  );
}

const SettingsClient = () => {
  const auth = useChatAuth();
  const generateUploadUrl = useMutation(api.chats.generateUploadUrl);
  const setMyProfilePicture = useMutation(api.users.setMyProfilePicture);
  const settings = useQuery(api.settings.getMySettings, auth.isLoggedIn ? { token: auth.token ?? "" } : "skip");
  const updateSettings = useMutation(api.settings.updateMySettings);
  const setMutedUser = useMutation(api.users.setMutedUser);
  const users = useQuery(
    api.users.listUsers,
    auth.isLoggedIn ? { token: auth.token ?? "" } : "skip"
  );
  const mutedUsers = useQuery(api.users.getMutedUsers, auth.isLoggedIn ? { token: auth.token ?? "" } : "skip");
  const [exportNonce, setExportNonce] = useState(0);
  const exportData = useQuery(
    api.chats.exportChats,
    auth.isLoggedIn && exportNonce > 0 ? { token: auth.token ?? "", limit: 2000 } : "skip"
  );

  const [userQuery, setUserQuery] = useState("");
  const [notificationError, setNotificationError] = useState<string | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);

  useEffect(() => {
    if (!exportData || exportNonce === 0) return;
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `chat-export-${Date.now()}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  }, [exportData, exportNonce]);

  const mutedSet = useMemo(() => new Set((mutedUsers ?? []).map((name) => name.toLowerCase())), [mutedUsers]);

  const filteredUsers = useMemo(() => {
    const q = userQuery.trim().toLowerCase();
    const list = (users ?? []).filter((user) => user !== auth.name);
    if (!q) return list;
    return list.filter((name) => name.toLowerCase().includes(q));
  }, [users, userQuery, auth.name]);

  if (!auth.isReady) {
    return <LoadingScreen title="Loading settings..." description="Fetching your chat preferences and privacy rules." />;
  }

  if (!auth.isLoggedIn) {
    return (
      <PageShell>
        <PageContainer className="flex min-h-[calc(100dvh-8rem)] items-center justify-center">
          <div className="w-full max-w-xl">
            <LoginCard
              title="Open settings"
              subtitle="Sign in to manage notifications, density, privacy, accessibility, and media behavior."
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

  const token = auth.token ?? "";

  return (
    <PageShell>
      <PageContainer>
        <PageHeader
          eyebrow="Settings"
          title="Personal preferences"
          description="Control how the app looks, sounds, and behaves without losing the fast messaging workflow."
          action={<Badge variant="secondary">Tinted light theme</Badge>}
        />

        <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="grid gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Appearance</CardTitle>
                <CardDescription>The UI is fixed to light mode. Use density, font scale, and contrast to tune readability.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <SettingRow
                  label="Tinted light interface"
                  description="The workspace keeps a brighter look, but with more color in the surfaces and chrome."
                  control={<Badge variant="default">Enabled</Badge>}
                />
                <SettingRow
                  label="Message density"
                  description="Switch between compact and comfortable spacing in the feed."
                  control={
                    <Button
                      variant="secondary"
                      onClick={() => {
                        const next = settings?.messageDensity === "compact" ? "comfortable" : "compact";
                        void updateSettings({ token, messageDensity: next });
                      }}
                    >
                      {settings?.messageDensity ?? "comfortable"}
                    </Button>
                  }
                />
                <SettingRow
                  label="Font scale"
                  description="Increase or decrease chat text without zooming the whole page."
                  control={
                    <div className="inline-flex items-center gap-2 rounded-full border border-[color:var(--border-1)] bg-[color:rgba(237,243,251,0.86)] px-2 py-1 shadow-sm">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-full"
                        onClick={() => {
                          const next = Math.max(0.9, Math.round(((settings?.fontScale ?? 1) - 0.1) * 10) / 10);
                          void updateSettings({ token, fontScale: next });
                        }}
                      >
                        <Minus className="h-4 w-4" aria-hidden="true" />
                      </Button>
                      <span className="min-w-10 text-center text-sm font-medium text-slate-700">{settings?.fontScale ?? 1}x</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-full"
                        onClick={() => {
                          const next = Math.min(1.3, Math.round(((settings?.fontScale ?? 1) + 0.1) * 10) / 10);
                          void updateSettings({ token, fontScale: next });
                        }}
                      >
                        <Plus className="h-4 w-4" aria-hidden="true" />
                      </Button>
                    </div>
                  }
                />
                <SettingRow
                  label="High contrast"
                  description="Increase contrast for text and borders across all screens."
                  control={<Switch checked={settings?.highContrast ?? false} onClick={() => settings && void updateSettings({ token, highContrast: !settings.highContrast })} />}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Notifications</CardTitle>
                <CardDescription>Decide when the app makes noise or asks the browser to surface alerts.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <SettingRow
                  label="Notification sound"
                  description="Play a short tone when a new message arrives from someone else."
                  control={<Switch checked={settings?.notificationSound ?? true} onClick={() => settings && void updateSettings({ token, notificationSound: !settings.notificationSound })} />}
                />
                <SettingRow
                  label="Desktop notifications"
                  description="Show browser notifications when the tab is in the background."
                  control={
                    <Switch
                      checked={settings?.desktopNotifications ?? false}
                      onClick={async () => {
                        if (!settings) return;
                        setNotificationError(null);
                        if (settings.desktopNotifications) {
                          void updateSettings({ token, desktopNotifications: false });
                          return;
                        }
                        if (typeof Notification === "undefined") {
                          setNotificationError("Desktop notifications are not supported in this browser.");
                          return;
                        }
                        const permission = await Notification.requestPermission();
                        if (permission !== "granted") {
                          setNotificationError("Notification permission was denied.");
                          return;
                        }
                        void updateSettings({ token, desktopNotifications: true });
                      }}
                    />
                  }
                />
                {notificationError ? <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{notificationError}</div> : null}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Privacy and accessibility</CardTitle>
                <CardDescription>Choose how visible your activity is and how much motion or automation the UI should use.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <SettingRow
                  label="Read receipts"
                  description="Mark rooms as read when you reach the newest message."
                  control={<Switch checked={settings?.readReceipts ?? true} onClick={() => settings && void updateSettings({ token, readReceipts: !settings.readReceipts })} />}
                />
                <SettingRow
                  label="Typing indicator"
                  description="Broadcast when you are actively writing in a room."
                  control={<Switch checked={settings?.typingIndicator ?? true} onClick={() => settings && void updateSettings({ token, typingIndicator: !settings.typingIndicator })} />}
                />
                <SettingRow
                  label="Reduced motion"
                  description="Trim motion-heavy transitions and smooth scrolling behavior."
                  control={<Switch checked={settings?.reducedMotion ?? false} onClick={() => settings && void updateSettings({ token, reducedMotion: !settings.reducedMotion })} />}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Media behavior</CardTitle>
                <CardDescription>Control how attachments behave when messages arrive.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <SettingRow
                  label="Auto-play GIFs"
                  description="Animate GIF attachments inline instead of showing a static download prompt."
                  control={<Switch checked={settings?.autoPlayGifs ?? true} onClick={() => settings && void updateSettings({ token, autoPlayGifs: !settings.autoPlayGifs })} />}
                />
                <SettingRow
                  label="Auto-download files"
                  description="Immediately download files you receive from other people."
                  control={<Switch checked={settings?.autoDownloadFiles ?? false} onClick={() => settings && void updateSettings({ token, autoDownloadFiles: !settings.autoDownloadFiles })} />}
                />
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4">
            <Card>
              <CardHeader>
                <Badge variant="outline">Muted users</Badge>
                <CardTitle>Manage muted people</CardTitle>
                <CardDescription>Muted users stay searchable so you can reverse the decision at any time.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input value={userQuery} onChange={(e) => setUserQuery(e.target.value)} placeholder="Search users" />
                <div className="grid gap-3">
                  {filteredUsers.length > 0 ? (
                    filteredUsers.map((name) => {
                      const isMuted = mutedSet.has(name.toLowerCase());
                      return (
                        <div key={name} className="flex items-center justify-between rounded-[24px] border border-[color:var(--border-1)] bg-[color:rgba(216,228,243,0.82)] px-4 py-3">
                          <div>
                            <div className="text-sm font-medium text-[color:var(--text-1)]">{name}</div>
                            <div className="text-sm text-[color:var(--text-3)]">{isMuted ? "Muted across chat surfaces" : "Messages remain visible"}</div>
                          </div>
                          <Button
                            variant={isMuted ? "destructive" : "secondary"}
                            size="sm"
                            onClick={() => {
                              void setMutedUser({ token, otherName: name, muted: !isMuted });
                            }}
                          >
                            {isMuted ? "Unmute" : "Mute"}
                          </Button>
                        </div>
                      );
                    })
                  ) : (
                    <div className="rounded-[24px] border border-dashed border-[color:var(--border-1)] bg-[color:rgba(236,243,251,0.74)] px-4 py-6 text-sm text-[color:var(--text-3)]">No matching users.</div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Badge variant="secondary">Data</Badge>
                <CardTitle>Tools</CardTitle>
                <CardDescription>Export local history or clear your saved session from this device.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  className="w-full justify-center"
                  onClick={() => {
                    setExportError(null);
                    setExportNonce(Date.now());
                  }}
                >
                  <Download className="h-4 w-4" aria-hidden="true" />
                  Export chat history
                </Button>
                <Button variant="outline" className="w-full justify-center" onClick={auth.logout}>
                  <MoonStar className="h-4 w-4" aria-hidden="true" />
                  Clear local session
                </Button>
                {exportError ? <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{exportError}</div> : null}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Badge variant="outline">Summary</Badge>
                <CardTitle>Current profile</CardTitle>
                <CardDescription>Your settings apply per signed-in user on this browser session.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-slate-600">
                <div className="rounded-[24px] border border-[color:var(--border-1)] bg-[color:rgba(216,228,243,0.82)] p-4">
                  <div className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--accent-text)]">Theme</div>
                  <div className="mt-2 text-lg font-semibold text-[color:var(--text-1)]">Tinted light</div>
                </div>
                <div className="rounded-[24px] border border-[color:var(--border-1)] bg-[color:rgba(216,228,243,0.82)] p-4">
                  <div className="flex items-center gap-2 text-[color:var(--text-1)]">
                    <Volume2 className="h-4 w-4" aria-hidden="true" />
                    Notification sound {settings?.notificationSound ? "enabled" : "disabled"}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </PageContainer>
    </PageShell>
  );
};

export { SettingsClient };
