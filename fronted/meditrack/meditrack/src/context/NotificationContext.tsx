import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type NotificationType = 'info' | 'success' | 'warning' | 'error';
export type NotificationScope = 'pharmacie' | 'caisse' | 'doctor' | 'patient' | 'all';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  scope: NotificationScope;
  timestamp: Date;
  read: boolean;
  data?: Record<string, any>;
}

interface NotificationContextType {
  notifications: Notification[];
  addNotification: (n: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  markAsRead: (id: string) => void;
  clearNotifications: (scope?: NotificationScope) => void;
  getUnreadCount: (scope: NotificationScope) => number;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider = ({ children, userRole }: { children: ReactNode; userRole: string }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // 🔔 Simulation WebSocket (à remplacer par vrai WS en prod)
  useEffect(() => {
    // Polling toutes les 30s pour les nouvelles notifications
    const interval = setInterval(() => {
      fetchNewNotifications();
    }, 30000);
    
    // Chargement initial
    fetchNewNotifications();
    
    return () => clearInterval(interval);
  }, [userRole]);

  const fetchNewNotifications = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch('http://localhost:8000/api/notifications/unread/', {
        headers: { 'Authorization': `Token ${token}` }
      });
      
      if (response.ok) {
        const newNotifs: Notification[] = await response.json();
        setNotifications(prev => {
          const existingIds = new Set(prev.map(n => n.id));
          const uniqueNew = newNotifs.filter(n => !existingIds.has(n.id));
          return [...uniqueNew, ...prev].slice(0, 50); // Garder max 50 notifs
        });
      }
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    }
  };

  const addNotification = (n: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const newNotif: Notification = {
      ...n,
      id: `notif_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      timestamp: new Date(),
      read: false,
    };
    setNotifications(prev => [newNotif, ...prev]);
    
    // Afficher notification navigateur si visible
    if (document.visibilityState === 'visible' && 'Notification' in window) {
      new Notification(n.title, { body: n.message, icon: '/logo.png' });
    }
  };

  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    // Optionnel: sync avec backend
  };

  const clearNotifications = (scope?: NotificationScope) => {
    setNotifications(prev => scope ? prev.filter(n => n.scope !== scope) : []);
  };

  const getUnreadCount = (scope: NotificationScope) => 
    notifications.filter(n => !n.read && (n.scope === scope || n.scope === 'all')).length;

  return (
    <NotificationContext.Provider value={{
      notifications,
      addNotification,
      markAsRead,
      clearNotifications,
      getUnreadCount,
    }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotifications must be used within NotificationProvider');
  return context;
};