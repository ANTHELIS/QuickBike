import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const NotificationDropdown = ({ userType = 'user' }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(false);
    const dropdownRef = useRef(null);

    const unreadCount = notifications.filter(n => n.status !== 'read').length;

    // Click outside to close
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const fetchNotifications = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem(`${userType}_token`);
            const endpoint = userType === 'captain' ? '/captains/notifications' : '/users/notifications';
            const res = await axios.get(`${import.meta.env.VITE_BASE_URL}${endpoint}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setNotifications(res.data.data || []);
        } catch (error) {
            console.error("Failed to fetch notifications");
        } finally {
            setLoading(false);
        }
    };

    const toggleDropdown = () => {
        if (!isOpen) fetchNotifications();
        setIsOpen(!isOpen);
    };

    const markAllAsRead = async (e) => {
        e.stopPropagation();
        try {
            const token = localStorage.getItem(`${userType}_token`);
            const endpoint = userType === 'captain' ? '/captains/notifications/read-all' : '/users/notifications/read-all';
            await axios.patch(`${import.meta.env.VITE_BASE_URL}${endpoint}`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            // Update local state locally
            setNotifications(prev => prev.map(n => ({ ...n, status: 'read' })));
        } catch (error) {
            console.error("Failed to mark all as read", error);
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button onClick={toggleDropdown} className="relative cursor-pointer focus:outline-none flex items-center justify-center w-10 h-10 rounded-full hover:bg-slate-100 dark:hover:bg-[#1a1c1e] transition-colors">
                <i className={`fa-solid fa-bell ${isOpen ? 'text-gray-800 dark:text-white' : 'text-gray-400 dark:text-[#888]'} hover:text-gray-800 dark:hover:text-white text-[18px] transition-colors`}></i>
                {unreadCount > 0 && (
                    <div className="absolute top-2 right-2 w-[8px] h-[8px] bg-orange-500 rounded-full border-2 border-white dark:border-[#111]"></div>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-white dark:bg-[#161719] border border-gray-200 dark:border-[#2b2d31] rounded-2xl shadow-2xl z-50 overflow-hidden flex flex-col max-h-[450px] animate-fade-in origin-top-right">
                    <div className="p-4 border-b border-gray-100 dark:border-[#2b2d31] flex justify-between items-center bg-gray-50 dark:bg-[#1f2125]">
                        <div className="flex items-center gap-2">
                            <h3 className="font-bold text-gray-900 dark:text-white font-['Manrope']">Notifications</h3>
                            {unreadCount > 0 && (
                                <span className="text-xs font-bold text-white bg-orange-500 px-2 py-0.5 rounded-full">{unreadCount} new</span>
                            )}
                        </div>
                        {unreadCount > 0 && (
                            <button onClick={markAllAsRead} className="text-xs font-semibold text-orange-500 hover:text-orange-600 transition-colors">
                                Mark all read
                            </button>
                        )}
                    </div>
                    
                    <div className="overflow-y-auto flex-1 p-2" style={{ scrollbarWidth: 'thin' }}>
                        {loading ? (
                            <div className="p-8 flex flex-col items-center justify-center text-gray-400">
                                <i className="fa-solid fa-circle-notch fa-spin text-2xl mb-3 text-orange-400"></i>
                                <span className="text-sm font-medium">Loading notifications...</span>
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className="p-10 flex flex-col items-center justify-center text-center">
                                <div className="w-16 h-16 bg-gray-100 dark:bg-[#1f2125] text-gray-300 dark:text-[#555] rounded-full flex items-center justify-center mb-4">
                                    <i className="fa-solid fa-bell-slash text-2xl"></i>
                                </div>
                                <p className="text-gray-900 dark:text-gray-200 font-bold mb-1">No notifications</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">You're all caught up!</p>
                            </div>
                        ) : (
                            <div className="space-y-1">
                                {notifications.map((notif, index) => {
                                    const isUnread = notif.status !== 'read';
                                    return (
                                        <div key={index} className={`flex gap-3 p-3 hover:bg-gray-50 dark:hover:bg-[#1f2125] transition-colors cursor-pointer group ${isUnread ? 'bg-orange-50/50 dark:bg-orange-500/5' : ''}`}>
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${isUnread ? 'bg-orange-100 dark:bg-orange-500/20 text-orange-500' : 'bg-gray-100 dark:bg-[#2b2d31] text-gray-500 dark:text-[#888]'}`}>
                                                <i className={`fa-solid ${notif.type === 'promo' ? 'fa-tag' : notif.type === 'safety' ? 'fa-shield-halved' : notif.type === 'payment' ? 'fa-credit-card' : 'fa-bell'} text-sm`}></i>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className={`text-sm ${isUnread ? 'font-black text-gray-900 dark:text-white' : 'font-semibold text-gray-700 dark:text-gray-300'} line-clamp-1 group-hover:text-orange-500 transition-colors`}>{notif.title}</p>
                                                <p className={`text-xs ${isUnread ? 'text-gray-600 dark:text-gray-300 font-medium' : 'text-gray-500 dark:text-gray-400'} leading-snug mt-0.5 line-clamp-2`}>{notif.body}</p>
                                                <p className="text-[10px] text-gray-400 dark:text-[#666] font-medium mt-1.5 uppercase tracking-wider">
                                                    {new Date(notif.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                            </div>
                                            {isUnread && (
                                                <div className="w-2 h-2 rounded-full bg-orange-500 mt-2 shrink-0 self-start"></div>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationDropdown;
