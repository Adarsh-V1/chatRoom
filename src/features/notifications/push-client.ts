"use client";

export function isPushSupported() {
  return (
    typeof window !== "undefined" &&
    "Notification" in window &&
    "serviceWorker" in navigator &&
    "PushManager" in window
  );
}

function base64UrlToUint8Array(value: string) {
  const normalized = `${value}${"=".repeat((4 - (value.length % 4)) % 4)}`
    .replace(/-/g, "+")
    .replace(/_/g, "/");

  const decoded = window.atob(normalized);
  return Uint8Array.from(decoded, (char) => char.charCodeAt(0));
}

export async function registerNotificationServiceWorker() {
  if (!isPushSupported()) {
    throw new Error("Push notifications are not supported in this browser.");
  }

  return navigator.serviceWorker.register("/notifications-sw.js", { scope: "/" });
}

export async function requestNotificationPermission() {
  if (!isPushSupported()) {
    throw new Error("Push notifications are not supported in this browser.");
  }

  return Notification.requestPermission();
}

export function getNotificationPermission(): NotificationPermission | "unsupported" {
  if (typeof window === "undefined" || typeof Notification === "undefined") {
    return "unsupported";
  }

  return Notification.permission;
}

export async function subscribeToPush(publicKey: string) {
  await registerNotificationServiceWorker();
  const registration = await navigator.serviceWorker.ready;
  const existing = await registration.pushManager.getSubscription();

  if (existing) {
    return existing;
  }

  return registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: base64UrlToUint8Array(publicKey),
  });
}

export async function getExistingPushSubscription() {
  if (!isPushSupported()) {
    return null;
  }

  await registerNotificationServiceWorker();
  const registration = await navigator.serviceWorker.ready;
  return registration.pushManager.getSubscription();
}

export async function unsubscribeFromPush() {
  const existing = await getExistingPushSubscription();
  if (!existing) {
    return null;
  }

  const endpoint = existing.endpoint;
  await existing.unsubscribe();
  return endpoint;
}

export function serializePushSubscription(subscription: PushSubscription) {
  const json = subscription.toJSON();
  const endpoint = json.endpoint ?? subscription.endpoint;
  const p256dh = json.keys?.p256dh;
  const auth = json.keys?.auth;

  if (!endpoint || !p256dh || !auth) {
    throw new Error("The browser returned an invalid push subscription.");
  }

  return {
    endpoint,
    expirationTime: json.expirationTime ?? null,
    keys: {
      p256dh,
      auth,
    },
  };
}
