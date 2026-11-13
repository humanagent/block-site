// Toda la configuración vive acá. Editá y recargá la extensión en chrome://extensions.
// mode: "off" (libre) | "hide" (feed oculto) | "limit" (hasta N posts por día)
var CONFIG = {
  enabled: true,

  // Sitios bloqueados por completo (dominio, sin www)
  blockedSites: ["example.com"],

  // Feeds por sitio: ids definidos en sites.js
  feeds: {
    x:         { mode: "limit", limit: 20 },
    linkedin:  { mode: "time", minutes: 5 },
    youtube:   { mode: "off" },
    instagram: { mode: "off" },
    reddit:    { mode: "off" },
    facebook:  { mode: "off" },
  },
};
