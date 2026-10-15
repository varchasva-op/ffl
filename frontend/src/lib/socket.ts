import { io, type Socket } from 'socket.io-client';
import { AUTH_TOKEN_KEY } from './api';

const socketUrl = import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_URL || undefined;

export function createFflSocket(token?: string | null): Socket {
  return io(socketUrl, {
    path: '/socket.io',
    autoConnect: true,
    transports: ['websocket', 'polling'],
    auth: { token: token || localStorage.getItem(AUTH_TOKEN_KEY) || '' },
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 600,
    reconnectionDelayMax: 5000,
  });
}
