
const CACHE_NAME = "student-planner-v1";
const APP_PREFIX = "/student-planner/";

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((key) => key.startsWith("student-planner-") && key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      );
      await self.clients.claim();
    })()
  );
});

// Handle notifications delivered through Web Push.
self.addEventListener("push", (event) => {
  let data = {
    title: "Student Planner",
    body: "You have an academic reminder.",
    url: APP_PREFIX
  };

  if (event.data) {
    try {
      data = { ...data, ...event.data.json() };
    } catch {
      data.body = event.data.text();
    }
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: APP_PREFIX + "icon.svg",
      badge: APP_PREFIX + "icon.svg",
      data: { url: data.url || APP_PREFIX }
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const targetUrl = new URL(
    event.notification.data?.url || APP_PREFIX,
    self.location.origin
  ).href;

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((windows) => {
      for (const windowClient of windows) {
        if (windowClient.url.startsWith(self.location.origin + APP_PREFIX)) {
          windowClient.focus();
          windowClient.navigate(targetUrl);
          return;
        }
      }
      return clients.openWindow(targetUrl);
    })
  );
});
