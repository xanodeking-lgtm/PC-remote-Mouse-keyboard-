import { useCallback, useEffect, useRef, useState } from 'react';
import type {
  ConnectionState,
  InputEventPayload,
  RoomPeers,
} from '../types/controller';

interface UsePadBridgeSocketOptions {
  room: string;
  role: 'controller' | 'receiver';
  onRemoteInput?: (payload: InputEventPayload) => void;
}

export function usePadBridgeSocket({
  room,
  role,
  onRemoteInput,
}: UsePadBridgeSocketOptions) {
  const [connectionState, setConnectionState] =
    useState<ConnectionState>('connecting');
  const [peers, setPeers] = useState<RoomPeers>({
    controllers: role === 'controller' ? 1 : 0,
    receivers: role === 'receiver' ? 1 : 0,
  });
  const [latencyMs, setLatencyMs] = useState<number | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const onRemoteInputRef = useRef(onRemoteInput);
  onRemoteInputRef.current = onRemoteInput;

  const roomRef = useRef(room);
  roomRef.current = room;
  const roleRef = useRef(role);
  roleRef.current = role;

  useEffect(() => {
    let closedByEffect = false;
    let reconnectTimer: number | null = null;
    let pingTimer: number | null = null;
    let attempt = 0;

    const connect = () => {
      if (closedByEffect) return;
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      setConnectionState('connecting');

      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        if (closedByEffect) {
          ws.close();
          return;
        }
        attempt = 0;
        setConnectionState('connected');
        ws.send(
          JSON.stringify({
            type: 'join',
            room: roomRef.current,
            role: roleRef.current,
          })
        );
        ws.send(JSON.stringify({ type: 'ping', ts: Date.now() }));
        pingTimer = window.setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'ping', ts: Date.now() }));
          }
        }, 4000);
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(String(event.data)) as {
            type: string;
            controllers?: number;
            receivers?: number;
            ts?: number;
            payload?: InputEventPayload;
          };

          if (msg.type === 'peers') {
            setPeers({
              controllers: msg.controllers ?? 0,
              receivers: msg.receivers ?? 0,
            });
          } else if (msg.type === 'pong' && typeof msg.ts === 'number') {
            setLatencyMs(Math.max(1, Date.now() - msg.ts));
          } else if (msg.type === 'input' && msg.payload) {
            onRemoteInputRef.current?.(msg.payload);
          }
        } catch {
          // Ignore malformed message
        }
      };

      ws.onclose = () => {
        if (pingTimer !== null) {
          window.clearInterval(pingTimer);
          pingTimer = null;
        }
        wsRef.current = null;
        if (closedByEffect) return;
        setConnectionState('disconnected');
        const delay = Math.min(4000, 500 * Math.pow(1.6, attempt));
        attempt += 1;
        reconnectTimer = window.setTimeout(connect, delay);
      };

      ws.onerror = () => {
        ws.close();
      };
    };

    connect();

    return () => {
      closedByEffect = true;
      if (reconnectTimer !== null) window.clearTimeout(reconnectTimer);
      if (pingTimer !== null) window.clearInterval(pingTimer);
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, []);

  // Re-join immediately when room or role changes while socket is open
  useEffect(() => {
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN && room) {
      ws.send(
        JSON.stringify({
          type: 'join',
          room,
          role,
        })
      );
    }
  }, [room, role]);

  const sendInput = useCallback((payload: InputEventPayload) => {
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(
        JSON.stringify({
          type: 'input',
          payload,
        })
      );
    }
  }, []);

  return {
    connectionState,
    peers,
    latencyMs,
    sendInput,
  };
}
