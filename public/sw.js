const CACHE_NAME = "pixtel-pwa-v3.3-sfx";

const CORE_ASSETS = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icon.svg",
  "./sfx/manifest.json",
];

const SFX_CLIPS = [
  "step_town",
  "step_meadow",
  "step_quartz",
  "step_amber",
  "step_ruins",
  "step_water",
  "boss_roar_warden",
  "boss_roar_blight",
  "boss_roar_gilded",
  "boss_roar_eraser",
  "chest_open",
  "waypoint_chime",
  "mine_hit",
  "mine_break",
  "forge_anvil",
  "coop_ping",
];

const SFX_ASSETS = SFX_CLIPS.flatMap((id) => [`./sfx/${id}.ogg`, `./sfx/${id}.mp3`]);

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      await cache.addAll(CORE_ASSETS);
      // Resiliently pre-cache all .ogg & .mp3 Retro 16-bit SFX for 100% offline mobile PWA play
      await Promise.allSettled(
        SFX_ASSETS.map(async (url) => {
          const res = await fetch(url, { cache: "no-cache" });
          if (res && res.status === 200) {
            await cache.put(url, res);
          }
        })
      );
    })
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET" || !req.url.startsWith(self.location.origin)) return;

  const urlObj = new URL(req.url);
  const isSfxAsset = urlObj.pathname.includes("/sfx/");

  // Cache-first fast path for immutable `/sfx/` audio buffers (instant 0ms offline mobile decoding!)
  if (isSfxAsset) {
    event.respondWith(
      caches.match(req, { ignoreSearch: true }).then((cached) => {
        if (cached) return cached;
        return fetch(req).then((res) => {
          if (res && res.status === 200 && res.type === "basic") {
            const clone = res.clone();
            caches.open(CACHE_NAME).then((c) => c.put(req, clone));
          }
          return res;
        });
      })
    );
    return;
  }

  // Network-first with offline cache fallback for HTML/JS/CSS app shell
  event.respondWith(
    fetch(req)
      .then((res) => {
        if (res && res.status === 200 && res.type === "basic") {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((c) => c.put(req, clone));
        }
        return res;
      })
      .catch(() => caches.match(req).then((cached) => cached || caches.match("./index.html")))
  );
});
