"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { Download, Minus, MoonStar, Plus, Volume2 } from "lucide-react";
import { toast } from "sonner";
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
import { usePushNotifications } from "@/src/features/notifications/usePushNotifications";
import { useTheme } from "@/src/app/ThemeProvider";
import { ThemeToggle } from "@/src/features/theme/ThemeToggle";
import { THEME_MAP } from "@/src/features/theme/theme-options";

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
    <div className="flex flex-col gap-3 rounded-[24px] border border-[color:var(--border-1)] bg-[color:var(--surface-4)] p-4 sm:flex-row sm:items-center sm:justify-between">
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
  const { theme } = useTheme();
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
  const { enableNotifications, disableNotifications, isBusy: isPushBusy, isSupported: isPushSupported, isConfigured: isPushConfigured } =
    usePushNotifications();

  useEffect(() => {
    if (!exportData || exportNonce === 0) return;
    try {
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `chat-export-${Date.now()}.json`;
      anchor.click();
      URL.revokeObjectURL(url);
      toast.success("Chat export downloaded");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to export chats");
    }
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
              onGoogleSubmit={auth.loginWithGoogle}
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
  const activeTheme = THEME_MAP.get(theme);

  const updatePreference = async (
    patch: {
      notificationSound?: boolean;
      desktopNotifications?: boolean;
      messageDensity?: "comfortable" | "compact";
      fontScale?: number;
      readReceipts?: boolean;
      typingIndicator?: boolean;
      reducedMotion?: boolean;
      highContrast?: boolean;
      autoPlayGifs?: boolean;
      autoDownloadFiles?: boolean;
    },
    label: string
  ) => {
    try {
      await updateSettings({ token, ...patch });
      toast.success(`${label} updated`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : `Failed to update ${label.toLowerCase()}`);
    }
  };

  return (
    <PageShell>
      <PageContainer>
        <PageHeader
          eyebrow="Settings"
          title="Personal preferences"
          description="Control how the app looks, sounds, and behaves without losing the fast messaging workflow."
          action={<ThemeToggle />}
        />

        <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="grid gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Appearance</CardTitle>
                <CardDescription>Choose from five full-site themes, then tune density, font scale, and contrast for readability.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <SettingRow
                  label="Color theme"
                  description="Applies across chat, dashboard, profile, groups, calls, and text surfaces."
                  control={<ThemeToggle className="w-full sm:w-auto" />}
                />
                <SettingRow
                  label="Message density"
                  description="Switch between compact and comfortable spacing in the feed."
                  control={
                    <Button
                      variant="secondary"
                      onClick={() => {
                        const next = settings?.messageDensity === "compact" ? "comfortable" : "compact";
                        void updatePreference({ messageDensity: next }, "Message density");
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
                    <div className="inline-flex items-center gap-2 rounded-full border border-[color:var(--border-1)] bg-[color:var(--surface-2)] px-2 py-1 shadow-sm">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-full"
                        onClick={() => {
                          const next = Math.max(0.9, Math.round(((settings?.fontScale ?? 1) - 0.1) * 10) / 10);
                          void updatePreference({ fontScale: next }, "Font scale");
                        }}
                      >
                        <Minus className="h-4 w-4" aria-hidden="true" />
                      </Button>
                      <span className="min-w-10 text-center text-sm font-medium text-[color:var(--text-2)]">{settings?.fontScale ?? 1}x</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-full"
                        onClick={() => {
                          const next = Math.min(1.3, Math.round(((settings?.fontScale ?? 1) + 0.1) * 10) / 10);
                          void updatePreference({ fontScale: next }, "Font scale");
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
                  control={<Switch checked={settings?.highContrast ?? false} onClick={() => settings && void updatePreference({ highContrast: !settings.highContrast }, "High contrast")} />}
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
                  control={<Switch checked={settings?.notificationSound ?? true} onClick={() => settings && void updatePreference({ notificationSound: !settings.notificationSound }, "Notification sound")} />}
                />
                <SettingRow
                  label="Desktop notifications"
                  description="Show native push notifications, even when the website is closed, and reopen the matching room when clicked."
                  control={
                    <Switch
                      checked={settings?.desktopNotifications ?? false}
                      onClick={async () => {
                        if (!settings) return;
                        setNotificationError(null);
                        if (settings.desktopNotifications) {
                          try {
                            await disableNotifications();
                            toast.success("Desktop notifications updated");
                          } catch (err) {
                            const message =
                              err instanceof Error ? err.message : "Failed to disable desktop notifications";
                            setNotificationError(message);
                            toast.error(message);
                          }
                          return;
                        }
                        if (!isPushSupported) {
                          const message = "Push notifications are not supported in this browser.";
                          setNotificationError(message);
                          toast.error(message);
                          return;
                        }
                        if (!isPushConfigured) {
                          const message = "Push notifications are not configured on the server yet.";
                          setNotificationError(message);
                          toast.error(message);
                          return;
                        }
                        try {
                          await enableNotifications();
                          toast.success("Desktop notifications updated");
                        } catch (err) {
                          const message = err instanceof Error ? err.message : "Failed to enable desktop notifications";
                          setNotificationError(message);
                          toast.error(message);
                        }
                      }}
                      disabled={isPushBusy}
                    />
                  }
                />
                {notificationError ? <div className="rounded-2xl border border-[color:var(--danger-border)] bg-[color:var(--danger-soft)] px-4 py-3 text-sm text-[color:var(--danger-text)]">{notificationError}</div> : null}
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
                  control={<Switch checked={settings?.readReceipts ?? true} onClick={() => settings && void updatePreference({ readReceipts: !settings.readReceipts }, "Read receipts")} />}
                />
                <SettingRow
                  label="Typing indicator"
                  description="Broadcast when you are actively writing in a room."
                  control={<Switch checked={settings?.typingIndicator ?? true} onClick={() => settings && void updatePreference({ typingIndicator: !settings.typingIndicator }, "Typing indicator")} />}
                />
                <SettingRow
                  label="Reduced motion"
                  description="Trim motion-heavy transitions and smooth scrolling behavior."
                  control={<Switch checked={settings?.reducedMotion ?? false} onClick={() => settings && void updatePreference({ reducedMotion: !settings.reducedMotion }, "Reduced motion")} />}
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
                  control={<Switch checked={settings?.autoPlayGifs ?? true} onClick={() => settings && void updatePreference({ autoPlayGifs: !settings.autoPlayGifs }, "Auto-play GIFs")} />}
                />
                <SettingRow
                  label="Auto-download files"
                  description="Immediately download files you receive from other people."
                  control={<Switch checked={settings?.autoDownloadFiles ?? false} onClick={() => settings && void updatePreference({ autoDownloadFiles: !settings.autoDownloadFiles }, "Auto-download files")} />}
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
                        <div key={name} className="flex items-center justify-between rounded-[24px] border border-[color:var(--border-1)] bg-[color:var(--surface-4)] px-4 py-3">
                          <div>
                            <div className="text-sm font-medium text-[color:var(--text-1)]">{name}</div>
                            <div className="text-sm text-[color:var(--text-3)]">{isMuted ? "Muted across chat surfaces" : "Messages remain visible"}</div>
                          </div>
                          <Button
                            variant={isMuted ? "destructive" : "secondary"}
                            size="sm"
                            onClick={async () => {
                              try {
                                await setMutedUser({ token, otherName: name, muted: !isMuted });
                                toast.success(isMuted ? `${name} unmuted` : `${name} muted`);
                              } catch (err) {
                                toast.error(err instanceof Error ? err.message : "Failed to update mute setting");
                              }
                            }}
                          >
                            {isMuted ? "Unmute" : "Mute"}
                          </Button>
                        </div>
                      );
                    })
                  ) : (
                    <div className="rounded-[24px] border border-dashed border-[color:var(--border-1)] bg-[color:var(--muted-surface)] px-4 py-6 text-sm text-[color:var(--text-3)]">No matching users.</div>
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
                    setExportNonce(Date.now());
                  }}
                >
                  <Download className="h-4 w-4" aria-hidden="true" />
                  Export chat history
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-center"
                  onClick={() => {
                    void (async () => {
                      await auth.logout();
                      toast.success("Local session cleared");
                    })();
                  }}
                >
                  <MoonStar className="h-4 w-4" aria-hidden="true" />
                  Clear local session
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Badge variant="outline">Summary</Badge>
                <CardTitle>Current profile</CardTitle>
                <CardDescription>Your settings apply per signed-in user on this browser session.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-[color:var(--text-2)]">
                <div className="rounded-[24px] border border-[color:var(--border-1)] bg-[color:var(--surface-4)] p-4">
                  <div className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--accent-text)]">Theme</div>
                  <div className="mt-2 text-lg font-semibold text-[color:var(--text-1)]">{activeTheme?.label ?? "Ocean Glass"}</div>
                  <div className="mt-1 text-sm text-[color:var(--text-3)]">{activeTheme?.mode === "dark" ? "Dark theme" : "Light theme"}</div>
                </div>
                <div className="rounded-[24px] border border-[color:var(--border-1)] bg-[color:var(--surface-4)] p-4">
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
