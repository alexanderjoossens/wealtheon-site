#!/usr/bin/env node
/* ============================================================
   WEALTHEON — One-off LinkedIn OAuth bootstrap
   ------------------------------------------------------------
   Runs the 3-legged authorization-code flow once to mint the
   initial access + refresh token, then writes them to
   data/linkedin-tokens.json. After this, lib/linkedin.js keeps
   the access token fresh on its own (refresh tokens last ~1 yr).

   Prereqs (see LINKEDIN_SETUP.md):
     • A LinkedIn Developer App linked to the company page
     • The "Community Management API" product approved on it
     • .env filled in (LINKEDIN_CLIENT_ID / SECRET / REDIRECT_URI / SCOPES)
     • The redirect URI below registered EXACTLY in the app's Auth tab

   Usage:  node scripts/linkedin-auth.js
   You must be signed in to LinkedIn as an ADMIN of the company page
   in the browser that opens.
   ============================================================ */
try { require('dotenv').config(); } catch (e) { /* dotenv optional */ }

const http = require('http');
const crypto = require('crypto');
const { URL } = require('url');
const { exec } = require('child_process');
const linkedin = require('../lib/linkedin');

const CLIENT_ID = process.env.LINKEDIN_CLIENT_ID;
const CLIENT_SECRET = process.env.LINKEDIN_CLIENT_SECRET;
const REDIRECT_URI = process.env.LINKEDIN_REDIRECT_URI || 'http://localhost:5599/callback';
const SCOPES = process.env.LINKEDIN_SCOPES || 'r_organization_social r_organization_admin';

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error('Missing LINKEDIN_CLIENT_ID / LINKEDIN_CLIENT_SECRET. Fill in .env first (see LINKEDIN_SETUP.md).');
  process.exit(1);
}

const redirect = new URL(REDIRECT_URI);
const PORT = Number(redirect.port) || 5599;
const CALLBACK_PATH = redirect.pathname || '/callback';
const state = crypto.randomBytes(16).toString('hex');

const authorizeUrl = 'https://www.linkedin.com/oauth/v2/authorization?' + new URLSearchParams({
  response_type: 'code',
  client_id: CLIENT_ID,
  redirect_uri: REDIRECT_URI,
  state,
  scope: SCOPES
}).toString();

function openBrowser(url) {
  const cmd = process.platform === 'win32' ? `start "" "${url}"`
            : process.platform === 'darwin' ? `open "${url}"`
            : `xdg-open "${url}"`;
  exec(cmd, (err) => { if (err) { /* user can copy/paste the URL manually */ } });
}

async function exchangeCode(code) {
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: REDIRECT_URI,
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET
  });
  const res = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`Token exchange failed: ${res.status} ${text}`);
  return JSON.parse(text); // { access_token, expires_in, refresh_token, refresh_token_expires_in }
}

const server = http.createServer(async (req, res) => {
  const u = new URL(req.url, REDIRECT_URI);
  if (u.pathname !== CALLBACK_PATH) { res.writeHead(404); return res.end('Not found'); }

  const err = u.searchParams.get('error');
  if (err) {
    res.writeHead(400, { 'Content-Type': 'text/plain' });
    res.end('Authorization error: ' + err + ' — ' + (u.searchParams.get('error_description') || ''));
    console.error('Authorization denied:', err);
    return server.close(() => process.exit(1));
  }
  if (u.searchParams.get('state') !== state) {
    res.writeHead(400, { 'Content-Type': 'text/plain' });
    res.end('State mismatch — possible CSRF. Aborted.');
    return server.close(() => process.exit(1));
  }
  const code = u.searchParams.get('code');
  if (!code) { res.writeHead(400); return res.end('No code in callback.'); }

  try {
    const j = await exchangeCode(code);
    const now = Date.now();
    linkedin.writeTokens({
      access_token: j.access_token,
      expires_at: now + ((j.expires_in || 0) * 1000),
      refresh_token: j.refresh_token || null,
      refresh_token_expires_at: j.refresh_token_expires_in ? now + (j.refresh_token_expires_in * 1000) : null
    });
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end('<h2>✅ Wealtheon × LinkedIn connected.</h2><p>Tokens saved to data/linkedin-tokens.json. You can close this tab.</p>');
    console.log('\n✅ Tokens saved to data/linkedin-tokens.json');
    console.log(`   access token expires in ~${Math.round((j.expires_in || 0) / 86400)} days`);
    if (!j.refresh_token) {
      console.warn('   ⚠ No refresh_token returned — enable refresh tokens for the app, or re-auth before expiry.');
    }
    server.close(() => process.exit(0));
  } catch (e) {
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end('Token exchange failed: ' + e.message);
    console.error(e.message);
    server.close(() => process.exit(1));
  }
});

server.listen(PORT, () => {
  console.log('LinkedIn OAuth bootstrap');
  console.log('────────────────────────');
  console.log('Listening for the callback on ' + REDIRECT_URI);
  console.log('Make sure this EXACT redirect URL is registered in your app (Auth tab).');
  console.log('\nOpen this URL in a browser signed in as a page admin:\n');
  console.log(authorizeUrl + '\n');
  openBrowser(authorizeUrl);
});
