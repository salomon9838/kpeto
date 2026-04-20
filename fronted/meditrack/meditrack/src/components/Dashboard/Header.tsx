// components/Dashboard/Header.tsx
import React from 'react';
import { User, Notification } from '../../types';

interface HeaderProps {
  currentUser: User;
  notifications: Notification[];
  showNotifications: boolean;
  onToggleNotifications: () => void;
  onNotificationClick: (id: number) => void;
}

const Header: React.FC<HeaderProps> = ({
  currentUser,
  notifications,
  showNotifications,
  onToggleNotifications,
  onNotificationClick
}) => {
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <>
      <div className="header">
        <div className="logo">🏥 MediTrack-Pro</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div className="notification-icon" onClick={onToggleNotifications}>
            🔔
            {unreadCount > 0 && (
              <span className="notification-badge">{unreadCount}</span>
            )}
          </div>
          <span style={{ color: '#2C5F7C', fontWeight: '600' }}>
            {currentUser.prenom} {currentUser.nom}
          </span>
        </div>
      </div>

      {showNotifications && (
        <div className="notification-dropdown" style={{ display: 'block' }}>
          {notifications.map(notif => (
            <div 
              key={notif.id} 
              className="notification-item" 
              onClick={() => onNotificationClick(notif.id)}
            >
              <h4>{notif.title}</h4>
              <p>{notif.message}</p>
            </div>
          ))}
        </div>
      )}
    </>
  );
};

export default Header;
