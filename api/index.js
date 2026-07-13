// Vercel serverless entrypoint.
//
// Vercel deploys this repo from GitHub but does NOT run a persistent Node
// server, so vercel.json rewrites every request to this function. server.js
// builds and exports the Express `app`, but only calls app.listen() / starts
// the LinkedIn poller when run directly (require.main === module) — importing
// it here therefore gives us the fully-wired app (all page routes, /api/*,
// sitemap.xml, robots.txt, the /fr + /nl fallbacks) with no second listener
// and no poller.
//
// vercel.json bundles public/** + data/** via includeFiles so the runtime
// res.sendFile(public/*.html) and the CSV / posts.json reads resolve on disk.
module.exports = require('../server.js').app;
