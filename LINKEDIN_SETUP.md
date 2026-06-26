# LinkedIn → Website syndication — setup

Every post on the Wealtheon **LinkedIn company page** is mirrored onto the
website at **`/news`** (`/fr/news`, `/nl/news`). It uses LinkedIn's official
**Community Management API** — no scraping — and auto-publishes new posts.

The website already contains the full pipeline. It stays dormant until the
environment credentials below are filled in; the moment they are, posts start
flowing with no code change.

```
LinkedIn company page  ──(official API)──►  poller (server.js, every 15 min)
                                              │  dedupe + download images
                                              ▼
                                         data/posts.json  ──►  GET /api/posts  ──►  /news page
```

## What flows automatically vs. what is one-time

| Step | Frequency | Who |
|------|-----------|-----|
| Create LinkedIn app + get Community Management API approved | once | you (manual, see below) |
| Fill `.env` and run the OAuth bootstrap | once | you |
| Re-mint the refresh token | once a year | you (reminder) |
| Fetch new posts → publish on the site | every 15 min | automatic |
| Refresh the access token | automatic (~every 60 days) | the server |

---

## 1. Create a LinkedIn Developer App

1. Go to <https://www.linkedin.com/developers/apps> → **Create app**.
2. Associate it with the **Wealtheon company page** (you must be a Page admin).
3. On the app's **Products** tab, request **Community Management API**.
   - ⚠ This is granted by **manual review** by LinkedIn and can take days to
     weeks. Until it's approved, the read calls will return 403 — that's
     expected. The site keeps working and shows the empty state meanwhile.
4. On the **Auth** tab, note the **Client ID** and **Client Secret**, and add
   an **Authorized redirect URL** exactly equal to `LINKEDIN_REDIRECT_URI`
   below (default `http://localhost:5599/callback`).

## 2. Find the organization URN

Your company page admin URL looks like `linkedin.com/company/<id>/admin/`.
The org URN is `urn:li:organization:<id>`.

## 3. Configure environment

```bash
cp .env.example .env
npm install          # installs dotenv (added for this feature)
```

Fill in `.env`:
- `LINKEDIN_CLIENT_ID`, `LINKEDIN_CLIENT_SECRET` — from step 1.
- `LINKEDIN_ORG_URN` — from step 2.
- `SYNC_TOKEN` — any long random string (protects the manual `/api/sync`).
- Leave `LINKEDIN_API_VERSION`, `LINKEDIN_REDIRECT_URI`, `LINKEDIN_SCOPES`,
  `POLL_MINUTES` at their defaults unless you have a reason to change them.

## 4. One-off OAuth bootstrap (mint the tokens)

With the app **approved**, run:

```bash
node scripts/linkedin-auth.js
```

It opens a browser. Sign in as a **Page admin**, approve the scopes, and it
writes `data/linkedin-tokens.json` (access token + refresh token). This file
is gitignored — keep it secret.

> The **access token** lasts ~60 days and the server refreshes it
> automatically. The **refresh token** lasts ~365 days, so re-run this command
> roughly once a year. Set a calendar/`/schedule` reminder.

## 5. Run

```bash
npm start
```

On boot you'll see `[linkedin] poller active — every 15 min`. It fetches on
startup and then on the interval. To force a sync immediately:

```bash
curl -X POST http://localhost:3000/api/sync \
  -H "Authorization: Bearer <SYNC_TOKEN>"
# → {"added": N}
```

Open `http://localhost:3000/news` to see the posts.

---

## How it maps to the code

- `lib/linkedin.js` — API client: token refresh, `GET /rest/posts?q=author`,
  image-URN resolution, normalization.
- `scripts/linkedin-auth.js` — the one-off 3-legged OAuth helper.
- `server.js` — the store (`data/posts.json`), image download into
  `public/uploads/linkedin/`, the dedupe + auto-publish `syncOnce()`, the
  `setInterval` poller, and the `/news`, `/api/posts`, `/api/sync` routes.
- `public/news.html` (+ `fr/`, `nl/`) — the page that renders `/api/posts`.

## Deploying on Railway (ephemeral filesystem)

Railway wipes the container filesystem on every redeploy/restart, so the token
file, the posts store and downloaded images do **not** survive unless you take
two steps. Both are required for posts to stick:

**1. Authenticate via env, not the token file.** You can't run the interactive
OAuth flow on Railway (no browser). Instead:
- Run `node scripts/linkedin-auth.js` **on your laptop** once (after approval).
- Open the generated `data/linkedin-tokens.json`, copy the `refresh_token`.
- In Railway → service → **Variables**, set `LINKEDIN_REFRESH_TOKEN` to that
  value (plus `LINKEDIN_CLIENT_ID`, `LINKEDIN_CLIENT_SECRET`, `LINKEDIN_ORG_URN`,
  `SYNC_TOKEN`). The server mints fresh access tokens from it automatically; the
  refresh token itself lasts ~365 days (re-mint yearly).

**2. Add a Volume for persistence.** In Railway → service → **Volumes**, add a
volume mounted at e.g. `/data`, then set the variable `STORAGE_DIR=/data`.
Posts (`/data/posts.json`) and images (`/data/uploads/linkedin/…`) then survive
redeploys. ⚠ Do **not** mount the volume over the repo's `data/` or
`public/uploads/` — those hold committed files (CSVs, the logo). Use a separate
path like `/data` and point `STORAGE_DIR` at it.

Without step 2 the site still works, but a redeploy resets it to an empty feed
and the 15-min poller only re-pulls recent posts (full history would be lost).

## One-time backfill of the whole post history

The routine poller only fetches recent posts. To import the **entire** history
once, call the sync endpoint with `?all=1`:

```bash
curl -X POST "https://<your-domain>/api/sync?all=1" \
  -H "Authorization: Bearer <SYNC_TOKEN>"
# → {"added": N, "fetched": M}   (pages through all posts; dedupes)
```

Safe to re-run — already-imported posts are skipped by URN.

## Operational notes

- **Single instance:** the poller runs inside the Express process. If you ever
  run more than one instance, move the poll to one instance (or an external
  cron hitting `/api/sync`) to avoid duplicate fetches. Dedupe by post URN
  makes duplicates harmless, but don't poll from many nodes needlessly.
- **API version sunsets:** LinkedIn retires versioned APIs periodically. If
  reads start failing with a version error, bump `LINKEDIN_API_VERSION`.
- **Auto-publish:** new posts go live immediately (no review queue). To add a
  review step later, write new posts with `status:"pending"` in `syncOnce()`
  and add an approval toggle.
