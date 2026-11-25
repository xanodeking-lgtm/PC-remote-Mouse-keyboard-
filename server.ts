import express from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { WebSocketServer, WebSocket } from 'ws';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

type PeerRole = 'controller' | 'receiver';

interface ClientMeta {
  ws: WebSocket;
  room: string;
  role: PeerRole;
}

const PORT = Number(process.env.PORT || 3000);
const isProduction = process.env.NODE_ENV === 'production';

const rooms = new Map<string, Set<ClientMeta>>();

function normalizeRoom(raw: unknown): string {
  if (typeof raw !== 'string') return '';
  return raw
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 6);
}

function broadcastPeers(roomId: string): void {
  const members = rooms.get(roomId);
  if (!members) return;

  let controllers = 0;
  let receivers = 0;
  for (const member of members) {
    if (member.role === 'controller') controllers += 1;
    else receivers += 1;
  }

  const msg = JSON.stringify({
    type: 'peers',
    room: roomId,
    controllers,
    receivers,
  });

  for (const member of members) {
    if (member.ws.readyState === WebSocket.OPEN) {
      member.ws.send(msg);
    }
  }
}

function removeClientFromRoom(client: ClientMeta): void {
  if (!client.room) return;
  const members = rooms.get(client.room);
  if (!members) return;
  members.delete(client);
  if (members.size === 0) {
    rooms.delete(client.room);
  } else {
    broadcastPeers(client.room);
  }
  client.room = '';
}

async function startServer(): Promise<void> {
  const app = express();
  app.use(express.json());

  app.get('/api/health', (_req, res) => {
    res.json({
      ok: true,
      activeRooms: rooms.size,
      timestamp: Date.now(),
    });
  });

  const server = http.createServer(app);
  const wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (ws) => {
    const client: ClientMeta = {
      ws,
      room: '',
      role: 'controller',
    };

    ws.on('message', (raw) => {
      let data: Record<string, unknown>;
      try {
        data = JSON.parse(raw.toString()) as Record<string, unknown>;
      } catch {
        return;
      }

      if (data.type === 'join') {
        const nextRoom = normalizeRoom(data.room);
        if (!nextRoom) return;
        const nextRole: PeerRole =
          data.role === 'receiver' ? 'receiver' : 'controller';

        if (client.room && client.room !== nextRoom) {
          removeClientFromRoom(client);
        }

        client.room = nextRoom;
        client.role = nextRole;

        let members = rooms.get(nextRoom);
        if (!members) {
          members = new Set<ClientMeta>();
          rooms.set(nextRoom, members);
        }
        members.add(client);
        broadcastPeers(nextRoom);
        return;
      }

      if (data.type === 'ping') {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'pong', ts: data.ts }));
        }
        return;
      }

      if (data.type === 'input' && client.room) {
        const members = rooms.get(client.room);
        if (!members) return;
        const relayMsg = JSON.stringify({
          type: 'input',
          payload: data.payload,
          ts: Date.now(),
        });
        for (const member of members) {
          if (member !== client && member.ws.readyState === WebSocket.OPEN) {
            member.ws.send(relayMsg);
          }
        }
      }
    });

    ws.on('close', () => {
      removeClientFromRoom(client);
    });

    ws.on('error', () => {
      removeClientFromRoom(client);
    });
  });

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true',
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`PadBridge server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start PadBridge server:', err);
  process.exit(1);
});
