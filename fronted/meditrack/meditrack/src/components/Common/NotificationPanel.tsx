import React, { useState, useEffect } from 'react';
import { FaBell, FaCheck, FaTimes, FaExclamationTriangle, FaInfoCircle, FaCheckCircle } from 'react-icons/fa';

interface Notification {
  id: number;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: Date;
  read: boolean;
  data?: Record<string, any>;
  action?: { label: string; onClick: () => void };
}

interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const NotificationPanel: React.FC<NotificationPanelProps> = ({ isOpen, onClose }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  // 🔔 Fetch notifications depuis l'API
  useEffect(() => {
    fetchNotifications();
    // Polling toutes les 30 secondes
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch('http://localhost:8000/api/notifications/unread/', {
        headers: { 'Authorization': `Token ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.map((n: any) => ({
          id: n.id,
          title: n.title,
          message: n.message,
          type: n.type || 'info',
          timestamp: new Date(n.created_at),
          read: n.read,
          data: n.data
        })));
      }
    } catch (err) {
      console.error('Erreur fetch notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: number) => {
    try {
      const token = localStorage.getItem('access_token');
      await fetch(`http://localhost:8000/api/notifications/${id}/read/`, {
        method: 'POST',
        headers: { 'Authorization': `Token ${token}` }
      });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    } catch (err) {
      console.error('Erreur mark as read:', err);
    }
  };

  const deleteNotification = (id: number) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'success': return <FaCheckCircle color="#22c55e" size={20} />;
      case 'warning': return <FaExclamationTriangle color="#f97316" size={20} />;
      case 'error': return <FaExclamationTriangle color="#ef4444" size={20} />;
      default: return <FaInfoCircle color="#3b82f6" size={20} />;
    }
  };

  const getBorderColor = (type: string) => {
    switch (type) {
      case 'success': return '#22c55e';
      case 'warning': return '#f97316';
      case 'error': return '#ef4444';
      default: return '#3b82f6';
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0, right: 0, bottom: 0,
      width: '400px',
      background: 'white',
      boxShadow: '-4px 0 20px rgba(0,0,0,0.15)',
      zIndex: 1000,
      display: 'flex',
      flexDirection: 'column',
      animation: 'slideIn 0.3s ease-out'
    }}>
      <style>{`
        @keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }
      `}</style>

      {/* Header */}
      <div style={{
        padding: '20px',
        background: '#0d9488',
        color: 'white',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
          <FaBell size={20} /> Notifications
        </h3>
        <button onClick={onClose} style={{
          background: 'none', border: 'none', color: 'white',
          fontSize: '24px', cursor: 'pointer', opacity: 0.8
        }}>×</button>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '10px' }}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
            Chargement...
          </div>
        ) : notifications.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
            <FaBell size={48} style={{ marginBottom: '16px', opacity: 0.3 }} />
            <p>Aucune nouvelle notification</p>
          </div>
        ) : (
          notifications.map(notification => (
            <div key={notification.id} style={{
              padding: '15px',
              marginBottom: '10px',
              background: notification.read ? '#f8fafc' : '#eff6ff',
              borderLeft: `4px solid ${getBorderColor(notification.type)}`,
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'background 0.2s'
            }}
            onClick={() => !notification.read && markAsRead(notification.id)}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                {getIcon(notification.type)}
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: '600', color: '#1e293b', marginBottom: '4px' }}>
                    {notification.title}
                  </div>
                  <div style={{ fontSize: '14px', color: '#64748b', marginBottom: '8px' }}>
                    {notification.message}
                  </div>
                  <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                    {notification.timestamp.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {!notification.read && (
                    <button onClick={(e) => { e.stopPropagation(); markAsRead(notification.id); }}
                      style={{ background: 'none', border: 'none', color: '#22c55e', cursor: 'pointer' }}>
                      <FaCheck size={16} />
                    </button>
                  )}
                  <button onClick={(e) => { e.stopPropagation(); deleteNotification(notification.id); }}
                    style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}>
                    <FaTimes size={16} />
                  </button>
                </div>
              </div>
              {notification.action && (
                <button onClick={(e) => { e.stopPropagation(); notification.action?.onClick(); }}
                  style={{
                    marginTop: '10px',
                    padding: '8px 16px',
                    background: '#0d9488',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: '500'
                  }}>
                  {notification.action.label}
                </button>
              )}
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div style={{
        padding: '15px',
        borderTop: '1px solid #e2e8f0',
        textAlign: 'center',
        fontSize: '13px',
        color: '#64748b'
      }}>
        {notifications.filter(n => !n.read).length} non lue(s) • Actualisé à {new Date().toLocaleTimeString('fr-FR')}
      </div>
    </div>
  );
};

export default NotificationPanel;