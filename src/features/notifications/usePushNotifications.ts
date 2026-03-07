"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useChatAuth } from "@/src/features/auth/useChatAuth";
import {
  getExistingPushSubscription,
  getNotificationPermission,
  isPushSupported,
  registerNotificationServiceWorker,
  requestNotificationPermission,
  serializePushSubscription,
  subscribeToPush,
  unsubscribeFromPush,
} from "./push-client";

type Options = {
  syncWhenEnabled?: boolean;
};

export function usePushNotifications(options: Options = {}) {
  const { syncWhenEnabled = false } = options;
  const auth = useChatAuth();
  const token = auth.token ?? "";
  const settings = useQuery(api.settings.getMySettings, auth.isLoggedIn ? { token } : "skip");
  const config = useQuery(api.pushSubscriptions.getPushConfiguration);
  const updateSettings = useMutation(api.settings.updateMySettings);
  const upsertPushSubscription = useMutation(api.pushSubscriptions.upsertPushSubscription);
  const removePushSubscription = useMutation(api.pushSubscriptions.removePushSubscription);

  const [permission, setPermission] = useState<NotificationPermission | "unsupported">(() =>
    getNotificationPermission()
  );
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setPermission(getNotificationPermission());
  }, []);

  useEffect(() => {
    if (!isPushSupported() || !config?.configured) {
      return;
    }

    void registerNotificationServiceWorker().catch(() => {
      // Ignore registration failures until the user explicitly enables notifications.
    });
  }, [config?.configured]);

  const syncSubscription = useCallback(async () => {
    if (!auth.isLoggedIn || !config?.configured || !config.publicKey) {
      return;
    }

    const subscription = await subscribeToPush(config.publicKey);
    await upsertPushSubscription({
      token,
      subscription: serializePushSubscription(subscription),
      userAgent: navigator.userAgent,
    });
  }, [auth.isLoggedIn, config?.configured, config?.publicKey, token, upsertPushSubscription]);

  useEffect(() => {
    if (!syncWhenEnabled || !auth.isLoggedIn || !settings?.desktopNotifications || permission !== "granted") {
      return;
    }

    void syncSubscription().catch(() => {
      // Keep syncing silent. Explicit toggles surface errors to the user.
    });
  }, [auth.isLoggedIn, permission, settings?.desktopNotifications, syncSubscription, syncWhenEnabled]);

  const enableNotifications = useCallback(async () => {
    if (!auth.isLoggedIn) {
      throw new Error("Sign in before enabling notifications.");
    }

    if (!config?.configured || !config.publicKey) {
      throw new Error(
        "Push notifications are not configured yet. Add VAPID keys to the Convex environment first."
      );
    }

    if (!isPushSupported()) {
      throw new Error("Push notifications are not supported in this browser.");
    }

    setBusy(true);
    try {
      const nextPermission =
        permission === "granted" ? permission : await requestNotificationPermission();

      setPermission(nextPermission);
      if (nextPermission !== "granted") {
        throw new Error("Notification permission was denied.");
      }

      await syncSubscription();
      await updateSettings({ token, desktopNotifications: true });
      return { enabled: true };
    } finally {
      setBusy(false);
    }
  }, [auth.isLoggedIn, config?.configured, config?.publicKey, permission, syncSubscription, token, updateSettings]);

  const disableNotifications = useCallback(async () => {
    if (!auth.isLoggedIn) {
      return { enabled: false };
    }

    setBusy(true);
    try {
      const existing = await getExistingPushSubscription();
      if (existing?.endpoint) {
        await removePushSubscription({ token, endpoint: existing.endpoint });
      }

      await unsubscribeFromPush();
      await updateSettings({ token, desktopNotifications: false });
      return { enabled: false };
    } finally {
      setBusy(false);
    }
  }, [auth.isLoggedIn, removePushSubscription, token, updateSettings]);

  const status = useMemo(
    () => ({
      isReady: !auth.isLoggedIn || settings !== undefined,
      isSupported: isPushSupported(),
      isConfigured: Boolean(config?.configured),
      isEnabled: Boolean(settings?.desktopNotifications),
      isBusy: busy,
      permission,
    }),
    [auth.isLoggedIn, busy, config?.configured, permission, settings]
  );

  return {
    ...status,
    enableNotifications,
    disableNotifications,
  };
}
