import { io } from 'socket.io-client';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:3001';

export function createAppSocket() {
  return io(API_BASE, {
    withCredentials: true,
    transports: ['websocket', 'polling'],
    autoConnect: true,
  });
}
