// Service Worker مبسّط وآمن لتفعيل خاصية PWA
// (نسخة محدثة: لا يتدخل إطلاقًا في طلبات API أو أي طلب غير GET لنفس الموقع)
const CACHE_NAME = "aljawzah-cache-v2";
const CORE_ASSETS = ["/", "/logo.png", "/manifest.json"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS).catch(() => {}))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const req = event.request;

  // لا تتدخل أبدًا في أي طلب غير GET (حفظ/تعديل/حذف بيانات)
  if (req.method !== "GET") return;

  // لا تتدخل أبدًا في طلبات لمواقع خارجية (مثل Supabase)
  if (new URL(req.url).origin !== self.location.origin) return;

  // فقط لملفات الموقع الثابتة نفسه: جرب الشبكة أولًا، واستخدم الكاش كحل بديل عند الفشل فقط
  event.respondWith(
    fetch(req)
      .then((response) => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(req, clone)).catch(() => {});
        return response;
      })
      .catch(() => caches.match(req))
  );
});
