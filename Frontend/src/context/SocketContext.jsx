import React, { createContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';

export const SocketContext = createContext();

const getToken = () =>
    localStorage.getItem('user_token') ||
    localStorage.getItem('captain_token') ||
    '';

// Create socket once at module level — always available, never null.
// The server auth middleware will validate the token on connect.
// If there's no token yet (first mount before login), the connection
// will be rejected by the server; after login, we call socket.connect() again.
const socket = io(import.meta.env.VITE_BASE_URL || '/', {
    auth: { token: getToken() },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 20,
    reconnectionDelay: 2000,
    autoConnect: true,
});

const SocketProvider = ({ children }) => {
    useEffect(() => {
        const onConnect = () => console.log('[Socket] Connected:', socket.id);
        const onDisconnect = (r) => console.log('[Socket] Disconnected:', r);
        const onError = (err) => console.warn('[Socket] Error:', err?.message || err);
        const onConnectError = (err) => {
            console.warn('[Socket] Connect error:', err.message);
            // If auth failed, try updating token and reconnecting (post-login scenario)
            const token = getToken();
            if (token && token !== socket.auth?.token) {
                socket.auth = { token };
                setTimeout(() => socket.connect(), 1000);
            }
        };

        socket.on('connect', onConnect);
        socket.on('disconnect', onDisconnect);
        socket.on('error', onError);
        socket.on('connect_error', onConnectError);

        // Reconnect with fresh token on every mount (handles post-login case)
        const token = getToken();
        if (token && token !== socket.auth?.token) {
            socket.auth = { token };
            socket.disconnect().connect();
        } else if (token && !socket.connected) {
            socket.connect();
        }

        return () => {
            socket.off('connect', onConnect);
            socket.off('disconnect', onDisconnect);
            socket.off('error', onError);
            socket.off('connect_error', onConnectError);
        };
    }, []);

    return (
        <SocketContext.Provider value={{ socket }}>
            {children}
        </SocketContext.Provider>
    );
};

export default SocketProvider;