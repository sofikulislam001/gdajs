/* সার্ভিস ওয়ার্কার: অ্যাপ ইনস্টল, অফলাইন ফলব্যাক ও পুশ নোটিফিকেশন। ডেটা (Supabase) কখনও ক্যাশ হয় না। */
const CACHE = "gajs-v3";
const OFFLINE = "/offline.html";

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll([OFFLINE, "/icon-192.png"])).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (req.mode === "navigate") {
    e.respondWith(fetch(req).catch(() => caches.match(OFFLINE)));
  }
});

self.addEventListener("push", (e) => {
  let d = {};
  try {
    d = e.data ? e.data.json() : {};
  } catch {
    d = { title: "নতুন নোটিফিকেশন", body: e.data ? e.data.text() : "" };
  }
  e.waitUntil(
    self.registration.showNotification(d.title || "গোদনাইল আলোকিত যুব শক্তি", {
      body: d.body || "",
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      data: { url: d.url || "/notifications" },
      lang: "bn",
    }),
  );
});

self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  let raw = (e.notification.data && e.notification.data.url) || "/notifications";
  if (!/^(\/|https?:\/\/)/.test(raw)) raw = "/notifications";
  const target = new URL(raw, self.location.origin).href;
  e.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      for (const c of list) {
        if (c.url.startsWith(self.location.origin) && "focus" in c) {
          if ("navigate" in c) c.navigate(target);
          return c.focus();
        }
      }
      return self.clients.openWindow(target);
    }),
  );
});
