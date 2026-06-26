/* ============================================================
   WEALTHEON — LinkedIn company-page fetch client
   ------------------------------------------------------------
   Talks to the official LinkedIn Community Management API to read
   the organisation's recent posts. Pure-ish module: it only reads
   from LinkedIn and never writes to our store (the poller in
   server.js owns the store + image downloads).

   Activation is gated entirely on environment credentials — with
   none set, isConfigured() is false and fetchOrgPosts() returns []
   so the rest of the site runs untouched.

   Docs: https://learn.microsoft.com/linkedin/marketing/community-management/shares/posts-api
   ============================================================ */
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const TOKENS_FILE = path.join(DATA_DIR, 'linkedin-tokens.json');

// Base URLs are overridable via env so the client can be pointed at a mock
// during testing; they default to the real LinkedIn endpoints in production.
const API_BASE = process.env.LINKEDIN_API_BASE || 'https://api.linkedin.com';
const OAUTH_BASE = process.env.LINKEDIN_OAUTH_BASE || 'https://www.linkedin.com/oauth/v2';

function cfg() {
  return {
    clientId: process.env.LINKEDIN_CLIENT_ID || '',
    clientSecret: process.env.LINKEDIN_CLIENT_SECRET || '',
    orgUrn: process.env.LINKEDIN_ORG_URN || '',          // e.g. urn:li:organization:12345
    version: process.env.LINKEDIN_API_VERSION || '202505' // YYYYMM — bump as LinkedIn sunsets versions
  };
}

/** True only when the env credentials needed to call LinkedIn are present. */
function isConfigured() {
  const c = cfg();
  return !!(c.clientId && c.clientSecret && c.orgUrn);
}

// ── Token storage (data/linkedin-tokens.json, gitignored) ──────
function readTokens() {
  try { return JSON.parse(fs.readFileSync(TOKENS_FILE, 'utf8')); }
  catch (e) { return null; }
}
function writeTokens(t) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(TOKENS_FILE, JSON.stringify(t, null, 2));
}

/** Exchange a refresh token for a fresh access token and persist both. */
async function refreshAccessToken(refreshToken) {
  const c = cfg();
  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
    client_id: c.clientId,
    client_secret: c.clientSecret
  });
  const res = await fetch(`${OAUTH_BASE}/accessToken`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body
  });
  if (!res.ok) {
    throw new Error(`LinkedIn token refresh failed: ${res.status} ${await res.text()}`);
  }
  const j = await res.json(); // { access_token, expires_in, refresh_token, refresh_token_expires_in }
  const now = Date.now();
  const prev = readTokens() || {};
  const tokens = {
    access_token: j.access_token,
    expires_at: now + ((j.expires_in || 0) * 1000),
    refresh_token: j.refresh_token || refreshToken,
    refresh_token_expires_at: j.refresh_token_expires_in
      ? now + (j.refresh_token_expires_in * 1000)
      : (prev.refresh_token_expires_at || null)
  };
  writeTokens(tokens);
  return tokens.access_token;
}

/**
 * Return a usable access token, refreshing it first if it is expired
 * (or within a 5-minute buffer of expiring). Throws if no token has
 * been minted yet — run scripts/linkedin-auth.js once to bootstrap.
 */
async function getAccessToken() {
  const t = readTokens();
  if (!t || !t.access_token) {
    throw new Error('No LinkedIn token on disk. Run: node scripts/linkedin-auth.js');
  }
  const buffer = 5 * 60 * 1000;
  if (t.expires_at && (t.expires_at - buffer) > Date.now()) {
    return t.access_token;            // still fresh
  }
  if (t.refresh_token) {
    return refreshAccessToken(t.refresh_token);
  }
  return t.access_token;              // no refresh token — return as-is (may 401)
}

function authHeaders(token) {
  return {
    Authorization: `Bearer ${token}`,
    'LinkedIn-Version': cfg().version,
    'X-Restli-Protocol-Version': '2.0.0'
  };
}

async function apiGet(url, token) {
  const res = await fetch(url, { headers: authHeaders(token) });
  if (!res.ok) {
    throw new Error(`LinkedIn GET ${url} → ${res.status} ${await res.text()}`);
  }
  return res.json();
}

/**
 * Resolve an image URN (urn:li:image:…) to a downloadable CDN URL.
 * The downloadUrl is short-lived, so the caller must fetch it promptly.
 */
async function resolveImage(imageUrn, token) {
  const url = `${API_BASE}/rest/images/${encodeURIComponent(imageUrn)}`;
  const data = await apiGet(url, token);
  return data.downloadUrl
    || (data.elements && data.elements[0] && data.elements[0].downloadUrl)
    || null;
}

/** Collect image URNs / URLs referenced by a post's `content` block. */
function imageRefsFrom(content) {
  const refs = [];
  if (!content) return refs;
  if (content.media && content.media.id) refs.push(content.media.id);
  if (content.multiImage && Array.isArray(content.multiImage.images)) {
    content.multiImage.images.forEach(im => { if (im && im.id) refs.push(im.id); });
  }
  if (content.article && content.article.thumbnail) refs.push(content.article.thumbnail);
  return refs;
}

/** Map a raw /rest/posts element to our normalized post shape. */
async function normalize(el, token) {
  const urn = el.id;
  const text = el.commentary || '';
  const publishedAt = el.publishedAt || el.createdAt || el.firstPublishedAt || null;

  const imageUrls = [];
  for (const ref of imageRefsFrom(el.content)) {
    if (typeof ref !== 'string') continue;
    if (ref.startsWith('urn:li:image:')) {
      const u = await resolveImage(ref, token).catch(() => null);
      if (u) imageUrls.push(u);
    } else if (/^https?:/i.test(ref)) {
      imageUrls.push(ref);
    }
  }

  return {
    urn,
    url: `https://www.linkedin.com/feed/update/${urn}`,
    publishedAt,
    text,
    imageUrls,   // remote CDN URLs — the poller downloads these locally
    raw: el
  };
}

/**
 * Fetch the organisation's most recent posts (newest first), normalized.
 * Returns [] (and warns) when credentials are absent, so callers never
 * need to special-case the unconfigured state.
 */
async function fetchOrgPosts(limit = 20) {
  if (!isConfigured()) {
    console.warn('[linkedin] not configured (missing LINKEDIN_* env) — skipping fetch');
    return [];
  }
  const c = cfg();
  const token = await getAccessToken();
  const author = encodeURIComponent(c.orgUrn);
  const url = `${API_BASE}/rest/posts?q=author&author=${author}&count=${limit}&sortBy=LAST_MODIFIED`;
  const data = await apiGet(url, token);
  const elements = Array.isArray(data.elements) ? data.elements : [];

  const posts = [];
  for (const el of elements) {
    try { posts.push(await normalize(el, token)); }
    catch (e) { console.error('[linkedin] normalize failed for', el && el.id, '-', e.message); }
  }
  return posts;
}

module.exports = {
  cfg,
  isConfigured,
  readTokens,
  writeTokens,
  refreshAccessToken,
  getAccessToken,
  resolveImage,
  normalize,
  fetchOrgPosts
};
