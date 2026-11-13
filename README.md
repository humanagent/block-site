# Block Site 🚫

A fun little weekend project: a tiny Chrome extension I built to save me from
myself. It blocks the sites I shouldn't open and puts a daily budget on my social
feeds, so "just checking LinkedIn" stays at five minutes instead of forty.

It replaces three extensions I had installed (a site blocker plus one feed blocker
per network) with about 200 lines of plain JavaScript. No popup, no account, no
tracking, no build step. The whole configuration is one file, `config.js`.

## My setup

What I actually run, straight from `config.js`:

| Site | Rule |
|------|------|
| A couple of sites I shouldn't open | Blocked completely |
| X / Twitter | 20 posts a day |
| LinkedIn | 5 minutes a day |
| YouTube, Instagram, Reddit, Facebook | Free (for now) |

Run out of budget and the feed goes empty with a note:
*"⏱️ Se acabaron tus 5 min de hoy"*. Come back tomorrow.

## What it does

- **Blocks sites completely.** Listed domains redirect to a "site blocked" page.
- **Hides feeds.** The feed disappears, but the rest of the site keeps working:
  search, messages, profiles, posting.
- **Limits feeds by posts per day.** See 20 posts, then the feed goes empty until
  tomorrow.
- **Limits sites by minutes per day.** Five minutes of LinkedIn, then the feed
  goes empty until tomorrow.

Supported feeds: X / Twitter, LinkedIn, YouTube, Instagram, Reddit, Facebook.

## Install

1. Clone this repo.
2. Open `chrome://extensions` and turn on **Developer mode**.
3. Click **Load unpacked** and pick the repo folder.
4. Turn off any other feed or site blockers so they don't fight each other.

After changing any file, press the reload button on the extension card and
refresh your open tabs.

## Configure

Edit `config.js`:

```js
var CONFIG = {
  enabled: true,

  // Blocked completely (domain, without www). Subdomains are included.
  blockedSites: ["example.com"],

  // Per-site feed rules
  feeds: {
    x:         { mode: "limit", limit: 20 },
    linkedin:  { mode: "time", minutes: 5 },
    youtube:   { mode: "off" },
    instagram: { mode: "off" },
    reddit:    { mode: "off" },
    facebook:  { mode: "off" },
  },
};
```

| mode    | What happens                                                              |
|---------|---------------------------------------------------------------------------|
| `off`   | Nothing. The site is untouched.                                           |
| `hide`  | The feed is always hidden.                                                |
| `limit` | You get `limit` posts per day. A counter (`12/20`) sits bottom right.     |
| `time`  | You get `minutes` minutes per day. A clock (`2:31 / 5:00`) sits bottom right. |

When a limit is reached, only the feed is hidden and a notice appears. Everything
resets the next day.

- **`limit`** counts a post once at least 60% of it has been on screen. Each post
  counts once per day, even if the site renders it again.
- **`time`** counts only while the tab is visible and focused. It counts time on
  the whole site, not only the feed, and all tabs share the same clock.

Set `enabled: false` to switch everything off without uninstalling.

## How it works

| File            | Role                                                                    |
|-----------------|-------------------------------------------------------------------------|
| `manifest.json` | Manifest V3. Injects the scripts into the supported sites.              |
| `config.js`     | Your settings. Normally the only file you edit.                         |
| `sites.js`      | Per site: domains, feed selectors, post selector, which paths are feeds. |
| `content.js`    | Hides the feed, counts posts and time, shows the notice and counter.    |
| `background.js` | Turns `blockedSites` into `declarativeNetRequest` redirect rules.       |
| `blocked.html`  | The page shown for a blocked site.                                      |

Daily usage (posts seen and seconds spent) is stored in `chrome.storage.local`
and never leaves your browser.

## Add a site

Add an entry to `SITES` in `sites.js`:

```js
{
  id: "example",
  name: "Example",
  hosts: ["example.com"],
  isFeed: (p) => p === "/",                // paths where the feed lives
  feed: ['[role="feed"]'],                 // container to hide
  item: "article",                         // one post (for limit mode)
  key: (el) => el.querySelector("a")?.getAttribute("href"), // stable post id
}
```

Then add the host to `content_scripts.matches` in `manifest.json` and a rule under
`feeds` in `config.js`.

## Status

It's a cat-and-mouse game: feed selectors break whenever a site redesigns, so
expect to adjust `sites.js` now and then.

- **X** and **LinkedIn**: checked against the live sites.
- **YouTube, Instagram, Reddit, Facebook**: selectors are best guesses and may
  need tuning.

The on-page notices are in Spanish.

Fork it, swap in your own guilty pleasures, and get back to work.
