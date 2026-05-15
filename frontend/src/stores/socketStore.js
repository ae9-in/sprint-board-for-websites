import { create } from 'zustand';
import { io } from 'socket.io-client';
import { toast } from 'sonner';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const useSocketStore = create((set, get) => ({
  socket: null,
  connected: false,

  connect: (orgId) => {
    const { socket: existingSocket } = get();
    if (existingSocket?.connected) return;

    const socket = io(SOCKET_URL, {
      withCredentials: true,
      transports: ['websocket', 'polling'],
    });

    socket.on('connect', () => {
      console.log('✓ Socket connected:', socket.id);
      set({ connected: true });
      socket.emit('join-org', orgId);
    });

    socket.on('disconnect', () => {
      console.log('✗ Socket disconnected');
      set({ connected: false });
    });

    socket.on('notification', (data) => {
      toast(data.title || 'New Update', {
        description: data.message,
        icon: '🔔',
      });
    });

    socket.on('activity-log', (data) => {
      // Could be used to update activity feed in real-time
      console.log('Real-time activity:', data);
    });

    set({ socket });
  },

  disconnect: () => {
    const { socket } = get();
    if (socket) {
      socket.disconnect();
      set({ socket: null, connected: false });
    }
  },

  emit: (event, data) => {
    const { socket } = get();
    if (socket) {
      socket.emit(event, data);
    }
  },
}));
