(() => {
  const host = location.hostname.replace(/^www\./, "");
  const site = SITES.find((s) => s.hosts.some((h) => host === h || host.endsWith("." + h)));
  if (!site) return;

  let enabled = CONFIG.enabled !== false; // también se apaga desde el ícono (storage "off")
  const cfg = { mode: "off", limit: 20, ...(CONFIG.feeds[site.id] || {}) };
  let seen = new Set(); // posts contados hoy
  let secs = 0; // segundos activos hoy en el sitio (modo "time")

  const today = () => new Date().toLocaleDateString("en-CA"); // YYYY-MM-DD en hora local

  // ── CSS: oculta el feed cuando <html> tiene la clase bs-hidden ──
  const style = document.createElement("style");
  // El CSS se activa/desactiva por contenido de la regla (X reescribe las clases de <html>)
  const HIDE_CSS = `:is(${site.feed.join(",")}) { display: none !important; }`;
  document.documentElement.append(style);

  // ── Overlay y contador ──
  const overlay = document.createElement("div");
  overlay.style.cssText =
    "position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);z-index:2147483647;" +
    "font:600 18px -apple-system,system-ui,sans-serif;color:#111;background:#fff;padding:24px 40px;" +
    "border-radius:16px;box-shadow:0 8px 40px rgba(0,0,0,.2);text-align:center;pointer-events:none";
  const pill = document.createElement("div");
  pill.style.cssText =
    "position:fixed;bottom:16px;right:16px;z-index:2147483647;font:600 12px -apple-system,system-ui,sans-serif;" +
    "color:#fff;background:rgba(0,0,0,.75);padding:6px 10px;border-radius:999px;pointer-events:none";

  function setNode(node, text) {
    if (text) {
      if (node.textContent !== text) node.textContent = text;
      if (!node.isConnected) document.documentElement.append(node);
    } else if (node.isConnected) node.remove();
  }

  // ── Estado de uso (storage.local, por día) ──
  async function loadUsage() {
    const { usage } = await chrome.storage.local.get("usage");
    const u = usage && usage.day === today() ? usage : { day: today(), seen: {}, time: {} };
    seen = new Set(u.seen[site.id] || []);
    secs = Math.max(secs, u.time?.[site.id] || 0);
  }
  async function saveUsage() {
    const { usage } = await chrome.storage.local.get("usage");
    const u = usage && usage.day === today() ? usage : { day: today(), seen: {}, time: {} };
    u.time = u.time || {};
    u.seen[site.id] = [...seen].slice(-5000);
    u.time[site.id] = Math.max(u.time[site.id] || 0, secs);
    await chrome.storage.local.set({ usage: u });
  }

  // ── Tiempo activo: suma 1s por segundo con la pestaña visible y con foco ──
  const limitSecs = (cfg.minutes || 0) * 60;
  function startTimer() {
    if (cfg.mode !== "time") return;
    let ticks = 0;
    setInterval(() => {
      if (!enabled || document.visibilityState !== "visible" || !document.hasFocus()) return;
      if (secs >= limitSecs) return;
      secs++;
      if (++ticks % 5 === 0 || secs >= limitSecs) saveUsage();
      update();
    }, 1000);
  }
  const fmt = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  // ── Conteo de posts vistos ──
  function keyOf(el) {
    const k = site.key?.(el);
    if (k) return k;
    const t = (el.innerText || "").slice(0, 200);
    let h = 0;
    for (let i = 0; i < t.length; i++) h = (h * 31 + t.charCodeAt(i)) | 0;
    return "h" + h;
  }

  const io = new IntersectionObserver(
    (entries) => {
      let changed = false;
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        io.unobserve(e.target);
        const k = keyOf(e.target);
        if (!seen.has(k)) {
          seen.add(k);
          changed = true;
        }
      }
      if (changed) {
        saveUsage();
        update();
      }
    },
    { threshold: 0.6 }
  );

  const tracked = new WeakSet();
  function scan() {
    document.querySelectorAll(site.item).forEach((el) => {
      if (!tracked.has(el)) {
        tracked.add(el);
        io.observe(el);
      }
    });
  }

  // ── Aplicar reglas ──
  function update() {
    const onFeed = site.isFeed(location.pathname);
    const postsHit = cfg.mode === "limit" && seen.size >= cfg.limit;
    const timeHit = cfg.mode === "time" && secs >= limitSecs;
    const limitHit = postsHit || timeHit;
    const hide = enabled && onFeed && (cfg.mode === "hide" || limitHit);

    if (!style.isConnected) document.documentElement.append(style);
    const css = hide ? HIDE_CSS : "";
    if (style.textContent !== css) style.textContent = css;
    setNode(
      overlay,
      hide
        ? cfg.mode === "hide"
          ? "🧘 Feed oculto — enfocate"
          : timeHit
          ? `⏱️ Se acabaron tus ${cfg.minutes} min de hoy`
          : `⏱️ Llegaste a tu límite de hoy (${cfg.limit} posts)`
        : null
    );
    const pillText =
      cfg.mode === "limit" ? `${seen.size}/${cfg.limit} hoy` : cfg.mode === "time" ? `${fmt(secs)} / ${cfg.minutes}:00` : null;
    setNode(pill, enabled && cfg.mode !== "hide" && cfg.mode !== "off" && !limitHit && (cfg.mode === "time" || onFeed) ? pillText : null);
    if (enabled && onFeed && cfg.mode === "limit" && !limitHit) scan();
  }

  // ── Arranque y reactividad (SPA, cambios desde el popup) ──
  async function init() {
    const { off } = await chrome.storage.local.get("off");
    enabled = CONFIG.enabled !== false && !off;
    await loadUsage();
    update();
    startTimer();
    let scheduled = false;
    new MutationObserver(() => {
      if (scheduled) return;
      scheduled = true;
      requestAnimationFrame(() => {
        scheduled = false;
        update();
      });
    }).observe(document.documentElement, { childList: true, subtree: true });
  }

  // Solo si otra pestaña cambió el uso (ignora los cambios propios)
  chrome.storage.onChanged.addListener(async (changes, area) => {
    if (area !== "local") return;
    if (changes.off) {
      enabled = CONFIG.enabled !== false && !changes.off.newValue;
      update();
    }
    if (!changes.usage) return;
    const day = changes.usage.newValue?.day;
    const other = changes.usage.newValue?.seen?.[site.id] || [];
    const otherSecs = changes.usage.newValue?.time?.[site.id] || 0;
    if (day === today() && (other.length > seen.size || otherSecs > secs)) {
      other.forEach((k) => seen.add(k));
      secs = Math.max(secs, otherSecs);
      update();
    }
  });

  init();
})();
