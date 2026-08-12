const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

function fileFor(uid) {
  const safe = String(uid).replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 64) || 'default';
  return path.join(DATA_DIR, safe + '.json');
}

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml' };

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.writeHead(204); return res.end(); }

  const url = new URL(req.url, 'http://localhost');
  const pathname = url.pathname;

  // health / mode check
  if (pathname === '/api/ping') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ ok: true, mode: 'node' }));
  }

  // load state
  if (pathname === '/api/load' && req.method === 'GET') {
    const uid = url.searchParams.get('uid') || '';
    if (!uid) { res.writeHead(400, { 'Content-Type': 'application/json' }); return res.end(JSON.stringify({ error: 'uid required' })); }
    let data = {};
    try { data = JSON.parse(fs.readFileSync(fileFor(uid), 'utf8')); } catch (e) { data = {}; }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify(data));
  }

  // save state
  if (pathname === '/api/save' && req.method === 'POST') {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', () => {
      let payload;
      try { payload = JSON.parse(body); } catch (e) { res.writeHead(400, { 'Content-Type': 'application/json' }); return res.end(JSON.stringify({ error: 'bad json' })); }
      const uid = payload && payload.uid;
      if (!uid) { res.writeHead(400, { 'Content-Type': 'application/json' }); return res.end(JSON.stringify({ error: 'uid required' })); }
      try {
        fs.writeFileSync(fileFor(uid), JSON.stringify(payload.data || {}, null, 2));
        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ ok: true }));
      } catch (e) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: String(e) }));
      }
    });
    return;
  }

  // static files
  let p = decodeURIComponent(pathname);
  if (p === '/') p = '/index.html';
  const fp = path.join(__dirname, 'public', p);
  if (!fp.startsWith(path.join(__dirname, 'public'))) { res.writeHead(403); return res.end('forbidden'); }
  fs.readFile(fp, (err, content) => {
    if (err) { res.writeHead(404, { 'Content-Type': 'text/plain' }); return res.end('not found'); }
    const ext = path.extname(fp);
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
    res.end(content);
  });
});

server.listen(PORT, () => console.log('AI planner sync server on ' + PORT));
