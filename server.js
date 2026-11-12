const http = require('http');
const fs = require('fs');
const path = require('path');
const { WebSocketServer } = require('ws');

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, 'public');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.svg': 'image/svg+xml'
};

const server = http.createServer((req, res) => {
  const urlPath = (req.url || '/').split('?')[0];
  const rel = urlPath === '/' ? 'index.html' : urlPath.replace(/^\/+/, '');
  const filePath = path.join(PUBLIC_DIR, rel);

  if (!filePath.startsWith(PUBLIC_DIR) || !fs.existsSync(filePath)) {
    res.writeHead(404);
    res.end('Not found');
    return;
  }
  const ext = path.extname(filePath);
  res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
  fs.createReadStream(filePath).pipe(res);
});

const wss = new WebSocketServer({ server });
const rooms = new Map();

function makeCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let out = '';
  for (let i = 0; i < 6; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return rooms.has(out) ? makeCode() : out;
}

wss.on('connection', (ws) => {
  let joinedRoom = null;

  ws.on('message', (raw) => {
    let msg;
    try { msg = JSON.parse(raw); } catch { return; }

    if (msg.type === 'create') {
      const code = makeCode();
      rooms.set(code, [ws]);
      joinedRoom = code;
      ws.send(JSON.stringify({ type: 'room_created', room: code }));
    } else if (msg.type === 'join') {
      const code = String(msg.room || '').toUpperCase();
      const players = rooms.get(code);
      if (!players) {
        ws.send(JSON.stringify({ type: 'error', message: `Room ${code} not found.` }));
        return;
      }
      if (players.length >= 2) {
        ws.send(JSON.stringify({ type: 'error', message: `Room ${code} is full.` }));
        return;
      }
      players.push(ws);
      joinedRoom = code;
      ws.send(JSON.stringify({ type: 'room_joined', room: code, seat: 2, ready: true }));
      if (players[0].readyState === 1) {
        players[0].send(JSON.stringify({ type: 'opponent_joined', room: code }));
      }
    } else if (msg.type === 'shot' && joinedRoom) {
      const players = rooms.get(joinedRoom) || [];
      for (const p of players) {
        if (p !== ws && p.readyState === 1) {
          p.send(JSON.stringify({ type: 'shot', sx: msg.sx, vx: msg.vx, vy: msg.vy }));
        }
      }
    }
  });

  ws.on('close', () => {
    if (!joinedRoom) return;
    const players = rooms.get(joinedRoom) || [];
    const remaining = players.filter((p) => p !== ws);
    if (remaining.length === 0) {
      rooms.delete(joinedRoom);
    } else {
      rooms.set(joinedRoom, remaining);
      if (remaining[0].readyState === 1) {
        remaining[0].send(JSON.stringify({ type: 'opponent_left' }));
      }
    }
  });
});

server.listen(PORT, () => {
  console.log(`Carrom Club server running on http://localhost:${PORT}`);
});
