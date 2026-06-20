import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuthStore } from '../stores/authStore';

const SocketContext = createContext(null);

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const { user, organization, isAuthenticated } = useAuthStore();

  useEffect(() => {
    const socketUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    const isVercel = typeof window !== 'undefined' && (
      window.location.hostname.includes('vercel.app') || 
      socketUrl.includes('vercel.app')
    );

    if (isVercel) {
      console.warn('⚠️ Serverless environment detected (Vercel). Real-time SocketContext disabled.');
      return;
    }

    if (isAuthenticated && user && organization) {
      const newSocket = io(socketUrl, {
        withCredentials: true,
        transports: ['websocket', 'polling'],
        reconnectionAttempts: 3, // Prevent infinite reconnection loops
        reconnectionDelay: 5000,
      });

      newSocket.on('connect', () => {
        console.log('✓ Connected to Real-time Sync Server');
        newSocket.emit('join-org', organization.id);
      });

      setSocket(newSocket);

      return () => {
        newSocket.close();
      };
    } else {
      if (socket) {
        socket.close();
        setSocket(null);
      }
    }
  }, [isAuthenticated, user?.id, organization?.id]);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};
