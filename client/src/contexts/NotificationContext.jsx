import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { io } from "socket.io-client";
import {
  fetchNotifications,
  fetchUnreadCount,
  markAllNotificationsRead,
  markNotificationRead,
} from "../api/notificationApi";
import { useAuth } from "./AuthContext";

const NotificationContext = createContext();

export function NotificationProvider({ children }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const pollRef = useRef(null);
  const socketRef = useRef(null);

  const loadNotifications = useCallback(async () => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }
    setLoading(true);
    try {
      const data = await fetchNotifications({ limit: 20 });
      setNotifications(data.items || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const loadUnreadOnly = useCallback(async () => {
    if (!user) return;
    try {
      const data = await fetchUnreadCount();
      setUnreadCount(data.unread || 0);
    } catch (err) {
      console.error("Failed to fetch unread count:", err);
    }
  }, [user]);

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      return;
    }

    loadNotifications();

    const baseURL = import.meta.env.VITE_API_URL || "http://localhost:5000";
    const socket = io(baseURL, {
      transports: ["websocket"],
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      socket.emit("notifications:join", user.uid);
    });

    socket.on("notification:new", (notification) => {
      setNotifications((prev) => [notification, ...prev].slice(0, 50));
      setUnreadCount((prev) => prev + (notification.read ? 0 : 1));
    });

    pollRef.current = setInterval(() => {
      loadUnreadOnly();
    }, 60000);

    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [user, loadNotifications, loadUnreadOnly]);

  const markAsRead = useCallback(
    async (id) => {
      try {
        await markNotificationRead(id);
        setNotifications((prev) =>
          prev.map((item) =>
            String(item._id) === String(id) ? { ...item, read: true } : item
          )
        );
        setUnreadCount((prev) => Math.max(prev - 1, 0));
      } catch (err) {
        console.error("Failed to mark notification as read:", err);
      }
    },
    [setNotifications]
  );

  const markAllAsRead = useCallback(async () => {
    try {
      await markAllNotificationsRead();
      setNotifications((prev) => prev.map((item) => ({ ...item, read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error("Failed to mark all notifications as read:", err);
    }
  }, []);

  const value = {
    notifications,
    unreadCount,
    loading,
    refresh: loadNotifications,
    markAsRead,
    markAllAsRead,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error("useNotifications must be used within provider");
  return ctx;
}
