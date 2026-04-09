import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import useAuthStore from '../store/authStore';
import useRideStore from '../store/rideStore';

const SocketContext = createContext(null);

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || '';

export function SocketProvider({ children }) {
  const socketRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const { token, user, userType, isAuthenticated } = useAuthStore();
  const { updateRideFromSocket, completeRide } = useRideStore();

  const connect = useCallback(() => {
    if (!token || !isAuthenticated) return;

    // Prevent duplicate connections
    if (socketRef.current?.connected) return;

    const socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 10,
    });

    socket.on('connect', () => {
      setIsConnected(true);
      // Join room
      if (user?._id) {
        socket.emit('join', {
          userId: user._id,
          userType: userType,
        });
      }
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    // Ride events (user-side)
    socket.on('ride-confirmed', (data) => {
      updateRideFromSocket(data);
    });

    socket.on('ride-started', (data) => {
      updateRideFromSocket(data);
    });

    socket.on('ride-ended', (data) => {
      completeRide(data);
    });

    // Ride events (captain-side)
    socket.on('new-ride', (data) => {
      // Dispatch custom event so captain pages can listen
      window.dispatchEvent(new CustomEvent('quickbike:new-ride', { detail: data }));
    });

    socketRef.current = socket;
  }, [token, isAuthenticated, user, userType, updateRideFromSocket, completeRide]);

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
      setIsConnected(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated && token) {
      connect();
    } else {
      disconnect();
    }
    return () => disconnect();
  }, [isAuthenticated, token, connect, disconnect]);

  // Send location update (captain only)
  const updateLocation = useCallback((lat, lng) => {
    if (socketRef.current?.connected && user?._id) {
      socketRef.current.emit('update-location-captain', {
        userId: user._id,
        location: { ltd: lat, lng },
      });
    }
  }, [user]);

  // Toggle captain online/offline status
  const updateCaptainStatus = useCallback((status) => {
    if (socketRef.current?.connected && user?._id) {
      socketRef.current.emit('update-status-captain', {
        userId: user._id,
        status, // 'active' or 'inactive'
      });
    }
  }, [user]);

  const value = {
    socket: socketRef.current,
    isConnected,
    updateLocation,
    updateCaptainStatus,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
}

export default SocketContext;
