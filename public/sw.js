/* Chaos Forge service worker — push notifications only.
 *
 * No fetch handler and no caching: the app loads exactly as without it.
 * Registered from the settings when a player turns push on
 * (src/lib/push/client.ts). The payload comes from /api/push/dispatch
 * (src/lib/push/payload.ts): { title, body, url, tag }.
 */

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  // Take control of open windows right away, so a click can navigate them.
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { body: event.data ? event.data.text() : "" };
  }

  event.waitUntil(
    self.registration.showNotification(data.title || "Chaos Forge", {
      body: data.body || "",
      tag: data.tag,
      icon: "/icon-192x192.png",
      badge: "/icon-192x192.png",
      data: { url: data.url || "/dashboard" },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = new URL(event.notification.data?.url || "/dashboard", self.location.origin).href;

  event.waitUntil(
    (async () => {
      const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      const existing = windows.find(
        (client) => new URL(client.url).origin === self.location.origin
      );
      if (existing) {
        try {
          await existing.focus();
          await existing.navigate(url);
          return;
        } catch {
          // Uncontrolled window or navigation refused — open a fresh one.
        }
      }
      await self.clients.openWindow(url);
    })()
  );
});
