import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import { configuredBackendOrigin } from '../services/api';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const SocketContext = createContext(null);

const socketBaseUrl = configuredBackendOrigin || window.location.origin.replace(/:3000$/, ':5000');

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [liveNotifications, setLiveNotifications] = useState([]);

  useEffect(() => {
    if (!user) {
      if (socket) {
        socket.close();
        setSocket(null);
      }
      return;
    }

    const newSocket = io(process.env.REACT_APP_SOCKET_URL || socketBaseUrl, {
      transports: ['websocket', 'polling'],
    });

    newSocket.on('connect', () => {
      newSocket.emit('join', user._id);
    });

    newSocket.on('notification', (notification) => {
      setLiveNotifications((prev) => [notification, ...prev].slice(0, 50));
      setUnreadCount((prev) => prev + 1);

      const icons = {
        new_donation: '🍽️',
        donation_requested: '📦',
        donation_assigned: '✅',
        donation_completed: '🌟',
        donation_cancelled: '❌',
        welcome: '🎉',
      };
      const icon = icons[notification.type] || '🔔';

      toast(
        (t) => (
          <div
            className="flex items-start gap-3 cursor-pointer"
            onClick={() => toast.dismiss(t.id)}
          >
            <span className="text-2xl">{icon}</span>
            <div>
              <p className="font-semibold text-sm text-gray-800">{notification.title}</p>
              <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{notification.message}</p>
            </div>
          </div>
        ),
        {
          duration: 5000,
          style: {
            background: '#fff',
            border: '1px solid #dcfce7',
            borderRadius: '12px',
            padding: '12px 16px',
            maxWidth: '380px',
          },
        }
      );
    });

    newSocket.on('new_donation', (data) => {
      if (user.role === 'ngo') {
        toast(`🍽️ New donation in ${data.donation?.pickupCity || 'your area'}!`, {
          duration: 6000,
          style: { background: '#f0fdf4', border: '1px solid #16a34a', borderRadius: '12px' },
        });
      }
    });

    newSocket.on('donation_assigned', () => {
      toast('✅ A donation pickup has been confirmed for you!', {
        duration: 5000,
        style: { background: '#eff6ff', border: '1px solid #3b82f6', borderRadius: '12px' },
      });
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?._id]);

  const decrementUnread = useCallback(() => {
    setUnreadCount((prev) => Math.max(0, prev - 1));
  }, []);

  const clearUnread = useCallback(() => setUnreadCount(0), []);

  return (
    <SocketContext.Provider
      value={{ socket, unreadCount, setUnreadCount, liveNotifications, decrementUnread, clearUnread }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error('useSocket must be used within SocketProvider');
  return ctx;
};
