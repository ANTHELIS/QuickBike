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

const GlobalNotification = ({ socket }) => {
    const [notif, setNotif] = useState(null);

    const timeoutRef = useRef(null);

    useEffect(() => {
        const handler = (data) => {
            const isUser = !!localStorage.getItem('user_token');
            const isCaptain = !!localStorage.getItem('captain_token');
            
            let shouldShow = false;
            
            if (data.audience === 'all') {
                shouldShow = true;
            } else if (data.audience === 'users' && isUser) {
                shouldShow = true;
            } else if (data.audience === 'captains' && isCaptain) {
                shouldShow = true;
            }
            
            if (shouldShow) {
                setNotif(data);
                if (timeoutRef.current) clearTimeout(timeoutRef.current);
                timeoutRef.current = setTimeout(() => setNotif(null), 5000);
            }
        };
        socket.on('new-notification', handler);
        return () => socket.off('new-notification', handler);
    }, [socket]);

    if (!notif) return null;
    
    return (
        <div style={{ position: 'fixed', top: '20px', left: '50%', transform: 'translateX(-50%)', zIndex: 99999, minWidth: '320px', maxWidth: '90vw' }} 
             className="flex items-start gap-4 px-5 py-4 rounded-2xl shadow-2xl bg-white dark:bg-slate-900 border border-transparent dark:border-slate-800 text-slate-900 dark:text-white transition-all transform translate-y-0 opacity-100">
            <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-500/20 flex items-center justify-center shrink-0">
                <i className={`fa-solid ${notif.type === 'promo' ? 'fa-tag' : notif.type === 'safety' ? 'fa-shield-halved' : notif.type === 'payment' ? 'fa-credit-card' : 'fa-bell'} text-orange-500 dark:text-orange-400 text-lg`} />
            </div>
            <div className="flex-1 mt-0.5">
                <p className="text-sm font-bold font-['Manrope']">{notif.title}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed font-['Inter']">{notif.body}</p>
            </div>
            <button onClick={() => setNotif(null)} className="shrink-0 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                <i className="fa-solid fa-xmark" />
            </button>
        </div>
    );
};

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
            <GlobalNotification socket={socket} />
            {children}
        </SocketContext.Provider>
    );
};

export default SocketProvider;