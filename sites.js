// Configuración por sitio. Para sumar uno nuevo, agregá un objeto acá.
// feed: selectores CSS del contenedor del feed (lo que se oculta)
// item: selector de cada post (lo que se cuenta en modo "limit")
// isFeed: en qué rutas aplica (así no se rompe perfil, mensajes, etc.)
// key: id estable de un post (para no contar dos veces el mismo)
var SITES = [
  {
    id: "x",
    name: "X / Twitter",
    hosts: ["x.com", "twitter.com"],
    isFeed: (p) => p === "/home" || p === "/",
    feed: [
      '[aria-label="Timeline: Your Home Timeline"]',
      '[data-testid="primaryColumn"] div[aria-label="Timeline"]',
      '[role="region"][aria-label*="Timeline"]',
    ],
    item: 'article[data-testid="tweet"]',
    key: (el) => el.querySelector('a[href*="/status/"]')?.getAttribute("href"),
  },
  {
    id: "linkedin",
    name: "LinkedIn",
    hosts: ["linkedin.com"],
    isFeed: (p) => p === "/" || p.startsWith("/feed"),
    feed: [
      '[data-testid="mainFeed"]', // UI nueva (/feed/foryou/)
      '[aria-label^="Main Feed"]',
      ".scaffold-finite-scroll",
      '[role="feed"]',
    ],
    item: "[data-testid='mainFeed'] [role='listitem'], [data-urn], [data-id^='urn:li:activity'], .feed-shared-update-v2",
    key: (el) => el.getAttribute("data-urn") || el.getAttribute("data-id"),
  },
  {
    id: "youtube",
    name: "YouTube",
    hosts: ["youtube.com"],
    isFeed: (p) => p === "/" || p === "/feed/subscriptions" || p.startsWith("/shorts"),
    feed: [
      'ytd-browse[page-subtype="home"] #contents',
      'ytd-browse[page-subtype="subscriptions"] #contents',
      "ytd-shorts",
    ],
    item: "ytd-rich-item-renderer, ytd-reel-video-renderer",
    key: (el) => el.querySelector("a#thumbnail")?.getAttribute("href"),
  },
  {
    id: "instagram",
    name: "Instagram",
    hosts: ["instagram.com"],
    isFeed: (p) => p === "/" || p.startsWith("/reels"),
    feed: ['main[role="main"]'],
    item: "article",
    key: (el) => el.querySelector('a[href*="/p/"], a[href*="/reel/"]')?.getAttribute("href"),
  },
  {
    id: "reddit",
    name: "Reddit",
    hosts: ["reddit.com"],
    isFeed: (p) => p === "/" || p.startsWith("/r/all") || p.startsWith("/popular"),
    feed: ["shreddit-feed", '[data-testid="posts-list"]'],
    item: "shreddit-post",
    key: (el) => el.getAttribute("permalink") || el.id,
  },
  {
    id: "facebook",
    name: "Facebook",
    hosts: ["facebook.com"],
    isFeed: (p) => p === "/" || p.startsWith("/home"),
    feed: ['[role="feed"]'],
    item: '[role="article"]',
    key: () => null,
  },
];

