const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');

const app = express();
const PORT = 3000;
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

// Serve static assets from /public (css, js, images, etc.)
app.use(express.static(PUBLIC_DIR));

// ── Page routes ──────────────────────────────────────────────

// Root → region selector
app.get('/', (req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, 'index.html'));
});

// Home page
app.get('/home', (req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, 'home.html'));
});

// Services page
app.get('/services', (req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, 'services.html'));
});

// About page
app.get('/about', (req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, 'about.html'));
});

// Data page
app.get('/data', (req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, 'data.html'));
});

// Upload manager page
app.get('/upload', (req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, 'upload.html'));
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
