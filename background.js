importScripts("config.js");

// Reglas de bloqueo total desde CONFIG.blockedSites
async function syncRules() {
  const existing = await chrome.declarativeNetRequest.getDynamicRules();
  const sites = CONFIG.enabled !== false ? CONFIG.blockedSites : [];
  await chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: existing.map((r) => r.id),
    addRules: sites.map((site, i) => ({
      id: i + 1,
      priority: 1,
      action: { type: "redirect", redirect: { extensionPath: `/blocked.html?site=${encodeURIComponent(site)}` } },
      condition: { requestDomains: [site], resourceTypes: ["main_frame"] },
    })),
  });
}

chrome.runtime.onInstalled.addListener(syncRules);
chrome.runtime.onStartup.addListener(syncRules);
