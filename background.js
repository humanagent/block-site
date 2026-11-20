importScripts("config.js");

// Una entrada con "/" bloquea solo esa ruta (y lo que cuelga de ella); sin "/", todo el dominio
const isPath = (site) => site.includes("/");
const blockedUrl = (site) => chrome.runtime.getURL(`blocked.html?site=${encodeURIComponent(site)}`);

// Encendido general: CONFIG.enabled y el botón de la barra (guarda "off" en storage.local)
async function isOn() {
  const { off } = await chrome.storage.local.get("off");
  return CONFIG.enabled !== false && !off;
}

// Reglas de bloqueo total desde CONFIG.blockedSites + estado del ícono
async function syncRules() {
  const on = await isOn();
  chrome.action.setBadgeText({ text: on ? "" : "OFF" });
  chrome.action.setBadgeBackgroundColor({ color: "#888" });
  chrome.action.setTitle({ title: on ? "Block Site: encendido" : "Block Site: apagado" });
  const existing = await chrome.declarativeNetRequest.getDynamicRules();
  const sites = on ? CONFIG.blockedSites : [];
  await chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: existing.map((r) => r.id),
    addRules: sites.map((site, i) => ({
      id: i + 1,
      priority: 1,
      action: { type: "redirect", redirect: { extensionPath: `/blocked.html?site=${encodeURIComponent(site)}` } },
      condition: isPath(site)
        ? { urlFilter: "||" + site, resourceTypes: ["main_frame"] }
        : { requestDomains: [site], resourceTypes: ["main_frame"] },
    })),
  });
}

async function setOff(off, minutes) {
  await chrome.alarms.clear("resume");
  if (off && minutes) chrome.alarms.create("resume", { delayInMinutes: minutes });
  await chrome.storage.local.set({ off });
  await syncRules();
}

chrome.runtime.onInstalled.addListener(syncRules);
chrome.runtime.onStartup.addListener(syncRules);

// Pedidos del popup: { off: true|false, minutes?: n }
chrome.runtime.onMessage.addListener((msg, _sender, reply) => {
  setOff(msg.off, msg.minutes).then(() => reply(true));
  return true;
});
// Fin de la pausa temporal
chrome.alarms.onAlarm.addListener(({ name }) => name === "resume" && setOff(false));

// Navegación interna de SPAs (GitHub, etc.): no hay request, así que se revisa la URL al cambiar
chrome.webNavigation.onHistoryStateUpdated.addListener(async ({ tabId, frameId, url }) => {
  if (frameId !== 0 || !(await isOn())) return;
  const clean = url.replace(/^https?:\/\/(www\.)?/, "");
  const site = CONFIG.blockedSites.filter(isPath).find((s) => clean.startsWith(s));
  if (site) chrome.tabs.update(tabId, { url: blockedUrl(site) });
});
