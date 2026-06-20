const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, 'data');
const PUBLIC_DIR = path.join(__dirname, 'public');
const UPLOADS_DIR = path.join(PUBLIC_DIR, 'uploads');

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

// Data page
app.get('/data', (req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, 'data.html'));
});

// Upload manager page
app.get('/upload', (req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, 'upload.html'));
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
                    '/funds', '/partners', '/foundation', '/contact'];

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

// ── Start ────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`Wealtheon running at http://localhost:${PORT}`);
});
