self.addEventListener("push", (event) => {
  if (!event.data) {
    return;
  }

  event.waitUntil(
    (async () => {
      const payload = event.data.json();
      const href = typeof payload?.href === "string" ? payload.href : "/chat";
      const targetUrl = new URL(href, self.location.origin).href;
      const clientsList = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });

      const hasFocusedTarget = clientsList.some((client) => {
        const visibilityState =
          typeof client.visibilityState === "string" ? client.visibilityState : "hidden";
        return client.url === targetUrl && (client.focused || visibilityState === "visible");
      });

      if (hasFocusedTarget) {
        return;
      }

      await self.registration.showNotification(payload?.title || "New message", {
        body: payload?.body || "Someone sent you a message.",
        icon: payload?.icon || "/convolink-mark.svg",
        badge: payload?.badge || "/convolink-mark.svg",
        tag: payload?.tag || "convolink-message",
        data: {
          href,
        },
      });
    })()
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  event.waitUntil(
    (async () => {
      const href =
        typeof event.notification?.data?.href === "string"
          ? event.notification.data.href
          : "/chat";
      const targetUrl = new URL(href, self.location.origin).href;
      const clientsList = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });

      for (const client of clientsList) {
        if (client.url === targetUrl) {
          await client.focus();
          if ("navigate" in client) {
            await client.navigate(targetUrl);
          }
          return;
        }
      }

      const nextClient = await self.clients.openWindow(targetUrl);
      if (nextClient) {
        await nextClient.focus();
      }
    })()
  );
});
