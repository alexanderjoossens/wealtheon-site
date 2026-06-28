try { require('dotenv').config(); } catch (e) { /* dotenv optional — env may be set by the host */ }

const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const linkedin = require('./lib/linkedin');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, 'data');
const PUBLIC_DIR = path.join(__dirname, 'public');
const UPLOADS_DIR = path.join(PUBLIC_DIR, 'uploads');

// LinkedIn syndication store + settings.
// STORAGE_DIR lets a host with an ephemeral filesystem (e.g. Railway) point the
// runtime store + downloaded images at a persistent volume. It must NOT be the
// repo's data/ or public/ dir (those hold committed files). Defaults preserve
// the original local-dev layout.
const STORAGE_DIR = process.env.STORAGE_DIR || DATA_DIR;
const POSTS_FILE = path.join(STORAGE_DIR, 'posts.json');
const LINKEDIN_UPLOADS = process.env.STORAGE_DIR
  ? path.join(process.env.STORAGE_DIR, 'uploads', 'linkedin')
  : path.join(UPLOADS_DIR, 'linkedin');
const SYNC_TOKEN = process.env.SYNC_TOKEN || '';
const POLL_MINUTES = Math.max(1, parseInt(process.env.POLL_MINUTES || '15', 10));

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext).replace(/[^a-z0-9_-]/gi, '_');
    cb(null, `${name}_${Date.now()}${ext}`);
  }
});
const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowed = /\.(jpg|jpeg|png|gif|webp|svg)$/i;
    cb(null, allowed.test(file.originalname));
  },
  limits: { fileSize: 10 * 1024 * 1024 }
});

// Production base URL for canonical / hreflang / sitemap (override via env).
const BASE_URL = (process.env.BASE_URL || 'https://www.wealtheon.eu').replace(/\/$/, '');
const LANGS = ['en', 'fr', 'nl'];

// Serve downloaded LinkedIn images from the (possibly volume-backed) store so
// /uploads/linkedin/* resolves even when STORAGE_DIR is outside /public.
// Registered first so it takes precedence over the general /public handler.
app.use('/uploads/linkedin', express.static(LINKEDIN_UPLOADS, {
  setHeaders: (res) => res.setHeader('Cache-Control', 'public, max-age=2592000')
}));

// Serve static assets from /public (css, js, images, etc.) with cache headers.
app.use(express.static(PUBLIC_DIR, {
  setHeaders: (res, filePath) => {
    if (/\.(jpg|jpeg|png|gif|webp|svg|ico|woff2?|ttf|eot)$/i.test(filePath)) {
      res.setHeader('Cache-Control', 'public, max-age=2592000'); // 30d for assets
    } else if (/\.(css|js)$/i.test(filePath)) {
      // Revalidate every time so edits to css/js show up immediately
      // (browser still caches but must check via ETag → cheap 304s).
      res.setHeader('Cache-Control', 'no-cache');
    } else if (/\.html$/i.test(filePath)) {
      res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
    }
  }
}));

// ── Page routes ──────────────────────────────────────────────

// Root → region selector
app.get('/', (req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, 'index.html'));
});

// Home page — the cinematic homepage (red default, blue via Style toggle)
app.get('/home', (req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, 'home6.html'));
});

// Homepage variations in the "Welcome" dropdown
app.get('/home1', (req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, 'home1.html'));
});
app.get('/home-blue', (req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, 'home-blue.html'));
});
app.get('/home-white', (req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, 'home-white.html'));
});
app.get('/home6', (req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, 'home6.html'));
});
app.get('/home7', (req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, 'home7.html'));
});

// Services pages — split into Direct Lines, Funds, Partners
app.get('/services', (req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, 'services.html'));
});
app.get('/direct-lines', (req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, 'direct-lines.html'));
});
app.get('/funds', (req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, 'funds.html'));
});
app.get('/partners', (req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, 'partners.html'));
});

// Individual fund detail pages (Funds tab)
app.get('/fund-world-equity', (req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, 'fund-world-equity.html'));
});
app.get('/fund-value-world-equity', (req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, 'fund-value-world-equity.html'));
});
app.get('/fund-high-conviction', (req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, 'fund-high-conviction.html'));
});
app.get('/fund-dbi-rdt', (req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, 'fund-dbi-rdt.html'));
});

// About page
app.get('/about', (req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, 'about.html'));
});

// Contact page
app.get('/contact', (req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, 'contact.html'));
});

// Foundation page
app.get('/foundation', (req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, 'foundation.html'));
});

// Careers page
app.get('/careers', (req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, 'careers.html'));
});

// Privacy policy
app.get('/privacy', (req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, 'privacy.html'));
});

// News & Insights — LinkedIn company-page posts syndicated here
app.get('/news', (req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, 'news.html'));
});

// Data page
app.get('/data', (req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, 'data.html'));
});

// Upload manager page
app.get('/upload', (req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, 'upload.html'));
});

// Legal / regulatory pages (footer "Juridische info")
app.get('/esg-beleid', (req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, 'esg-beleid.html'));
});
app.get('/klacht', (req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, 'klacht.html'));
});
app.get('/beleggersrechten', (req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, 'beleggersrechten.html'));
});
app.get('/top-5-execution-venues', (req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, 'top-5-execution-venues.html'));
});

// ── Localised pages: /fr/* and /nl/* ─────────────────────────
// Serves public/<lang>/<page>.html when it exists, otherwise falls
// back to the English page so language switching never 404s.
app.get(/^\/(fr|nl)(?:\/(.*))?$/, (req, res) => {
  const lang = req.params[0];
  let rest = (req.params[1] || '').replace(/\/+$/, '');
  let page = rest === '' ? 'index' : rest;
  if (page === 'home') page = 'home6';          // /home alias → home6.html
  page = page.replace(/[^a-z0-9_-]/gi, '');     // flatten + guard traversal
  const langFile = path.join(PUBLIC_DIR, lang, page + '.html');
  if (fs.existsSync(langFile)) return res.sendFile(langFile);
  const enFile = path.join(PUBLIC_DIR, page + '.html');
  if (fs.existsSync(enFile)) return res.sendFile(enFile);
  return res.status(404).sendFile(path.join(PUBLIC_DIR, 'index.html'));
});

// ── SEO: robots.txt + multilingual sitemap.xml ───────────────
const SITE_PAGES = ['/', '/home', '/about', '/services', '/direct-lines',
                    '/funds', '/fund-world-equity', '/fund-value-world-equity',
                    '/fund-high-conviction', '/fund-dbi-rdt',
                    '/partners', '/foundation', '/news', '/contact'];

function locFor(lang, p) {
  if (lang === 'en') return BASE_URL + p;
  return BASE_URL + '/' + lang + (p === '/' ? '/' : p);
}

app.get('/sitemap.xml', (req, res) => {
  let urls = '';
  SITE_PAGES.forEach(p => {
    LANGS.forEach(lang => {
      const alts = LANGS.map(a =>
        `<xhtml:link rel="alternate" hreflang="${a}" href="${locFor(a, p)}"/>`).join('') +
        `<xhtml:link rel="alternate" hreflang="x-default" href="${locFor('en', p)}"/>`;
      urls += `<url><loc>${locFor(lang, p)}</loc><changefreq>monthly</changefreq>${alts}</url>`;
    });
  });
  res.type('application/xml').send(
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" ' +
    'xmlns:xhtml="http://www.w3.org/1999/xhtml">' + urls + '</urlset>');
});

app.get('/robots.txt', (req, res) => {
  res.type('text/plain').send(
    'User-agent: *\nAllow: /\n\nSitemap: ' + BASE_URL + '/sitemap.xml\n');
});

// ── API: list and parse all CSV files in /data ───────────────
app.get('/api/data', (req, res) => {
  try {
    const files = fs.readdirSync(DATA_DIR).filter(f => f.endsWith('.csv'));
    const result = files.map(file => {
      const raw = fs.readFileSync(path.join(DATA_DIR, file), 'utf8');
      const lines = raw.trim().split('\n').map(l => l.split(',').map(v => v.trim()));
      const headers = lines[0];
      const rows = lines.slice(1);
      return { file, headers, rows };
    });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── API: upload images ───────────────────────────────────────
app.post('/api/upload', upload.array('images', 20), (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: 'No valid image files uploaded.' });
  }
  const uploaded = req.files.map(f => ({ filename: f.filename, url: '/uploads/' + f.filename, size: f.size }));
  res.json({ uploaded });
});

// ── API: list uploaded images ────────────────────────────────
app.get('/api/images', (req, res) => {
  try {
    const imageExts = /\.(jpg|jpeg|png|gif|webp|svg)$/i;
    const files = fs.readdirSync(UPLOADS_DIR).filter(f => imageExts.test(f));
    const images = files.map(f => {
      const stat = fs.statSync(path.join(UPLOADS_DIR, f));
      return { filename: f, url: '/uploads/' + f, size: stat.size, modified: stat.mtime };
    }).sort((a, b) => new Date(b.modified) - new Date(a.modified));
    res.json({ images });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── API: delete an uploaded image ────────────────────────────
app.delete('/api/images/:filename', (req, res) => {
  const filename = path.basename(req.params.filename);
  const filepath = path.join(UPLOADS_DIR, filename);
  if (!fs.existsSync(filepath)) return res.status(404).json({ error: 'File not found.' });
  fs.unlinkSync(filepath);
  res.json({ deleted: filename });
});

// ── LinkedIn syndication: store + poller ─────────────────────
function readPosts() {
  try { return JSON.parse(fs.readFileSync(POSTS_FILE, 'utf8')); }
  catch (e) { return []; }
}
function writePosts(posts) {
  fs.mkdirSync(STORAGE_DIR, { recursive: true });
  fs.writeFileSync(POSTS_FILE, JSON.stringify(posts, null, 2));
}

// Download a remote image into public/uploads/linkedin and return its web path.
async function downloadImage(url, urn) {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const ct = res.headers.get('content-type') || '';
    const ext = ct.includes('png') ? '.png'
              : ct.includes('gif') ? '.gif'
              : ct.includes('webp') ? '.webp'
              : '.jpg';
    fs.mkdirSync(LINKEDIN_UPLOADS, { recursive: true });
    const safe = String(urn).replace(/[^a-z0-9]/gi, '_');
    const name = `${safe}_${Date.now()}${ext}`;
    fs.writeFileSync(path.join(LINKEDIN_UPLOADS, name), Buffer.from(await res.arrayBuffer()));
    return '/uploads/linkedin/' + name;
  } catch (e) {
    console.error('[linkedin] image download failed:', e.message);
    return null;
  }
}

// One sync cycle: fetch from LinkedIn, dedupe by urn, download images,
// auto-publish new posts. Guarded so interval + manual runs can't overlap.
// { all:true } pages through the ENTIRE post history (one-time backfill);
// otherwise it grabs the most recent posts (the routine poll).
let syncing = false;
async function syncOnce({ all = false } = {}) {
  if (syncing) return { added: 0, skipped: 'in-progress' };
  syncing = true;
  try {
    const fetched = all ? await linkedin.fetchAllOrgPosts() : await linkedin.fetchOrgPosts(20);
    if (!fetched.length) return { added: 0, fetched: 0 };
    const posts = readPosts();
    const seen = new Set(posts.map(p => p.urn));
    let added = 0;
    for (const f of fetched) {
      if (seen.has(f.urn)) continue;
      const images = [];
      for (const u of (f.imageUrls || [])) {
        const local = await downloadImage(u, f.urn);
        if (local) images.push(local);
      }
      posts.push({
        urn: f.urn,
        url: f.url,
        publishedAt: f.publishedAt || Date.now(),
        fetchedAt: Date.now(),
        text: f.text || '',
        images,
        status: 'published'   // auto-publish
      });
      seen.add(f.urn);
      added++;
    }
    if (added) {
      posts.sort((a, b) => (b.publishedAt || 0) - (a.publishedAt || 0));
      writePosts(posts);
    }
    return { added, fetched: fetched.length };
  } finally {
    syncing = false;
  }
}

// ── API: published posts for the News page ───────────────────
app.get('/api/posts', (req, res) => {
  const posts = readPosts()
    .filter(p => p.status === 'published')
    .sort((a, b) => (b.publishedAt || 0) - (a.publishedAt || 0));
  res.json({ posts });
});

// ── API: trigger a sync on demand (Bearer SYNC_TOKEN) ────────
// POST /api/sync          → fetch the most recent posts
// POST /api/sync?all=1     → one-time backfill of the ENTIRE history
app.post('/api/sync', async (req, res) => {
  if (!SYNC_TOKEN) return res.status(503).json({ error: 'SYNC_TOKEN not configured' });
  if ((req.headers.authorization || '') !== `Bearer ${SYNC_TOKEN}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const all = req.query.all === '1' || req.query.all === 'true';
  try {
    res.json(await syncOnce({ all }));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Start ────────────────────────────────────────────────────
// Only listen + poll when run directly (node server.js); skipped when this
// module is require()'d by a test harness.
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Wealtheon running at http://localhost:${PORT}`);

    if (linkedin.isConfigured()) {
      const tick = () => syncOnce()
        .then(r => { if (r.added) console.log(`[linkedin] synced ${r.added} new post(s)`); })
        .catch(e => console.error('[linkedin] sync error:', e.message));
      setTimeout(tick, 10 * 1000);                    // first run shortly after boot
      setInterval(tick, POLL_MINUTES * 60 * 1000);    // then every POLL_MINUTES
      console.log(`[linkedin] poller active — every ${POLL_MINUTES} min`);
    } else {
      console.log('[linkedin] not configured — /news shows published posts only. See LINKEDIN_SETUP.md');
    }
  });
}

module.exports = { app, syncOnce, readPosts, writePosts, downloadImage };
