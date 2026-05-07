import { useState, useEffect } from 'react';
import { Bell, CheckCircle2, MessageSquare, UserPlus, X, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { getNotifications, markAsRead, markAllAsRead } from '../../api/notification.api';
import toast from 'react-hot-toast';

const NotificationCenter = ({ isOpen, onClose }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      const res = await getNotifications();
      setNotifications(res.data.notifications);
    } catch (err) {
      console.error('Failed to fetch notifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) fetchNotifications();
  }, [isOpen]);

  const handleMarkRead = async (id) => {
    try {
      await markAsRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    } catch (err) {
      toast.error('Failed to mark as read');
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      toast.success('All marked as read');
    } catch (err) {
      toast.error('Failed to mark all as read');
    }
  };

  if (!isOpen) return null;

  const getIcon = (type) => {
    switch (type) {
      case 'COMMENT': return <MessageSquare size={14} className="text-primary" />;
      case 'ASSIGNMENT': return <CheckCircle2 size={14} className="text-success" />;
      case 'INVITE': return <UserPlus size={14} className="text-accent" />;
      default: return <Bell size={14} className="text-text_muted" />;
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-dark/20 backdrop-blur-[2px]" onClick={onClose} />
      
      {/* Panel */}
      <div className="relative w-full max-w-sm h-screen bg-surface border-l border-border shadow-2xl flex flex-col">
        <div className="p-6 border-b border-border flex items-center justify-between">
          <div>
            <h2 className="text-lg font-heading font-bold text-dark">Notifications</h2>
            <p className="text-xs text-text_muted mt-0.5">Your team updates</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-background rounded-xl transition-colors">
            <X size={20} className="text-text_muted" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-sm font-bold text-dark">All caught up!</p>
              <p className="text-xs text-text_muted mt-1">No new notifications.</p>
            </div>
          ) : (
            notifications.map((n) => (
              <div 
                key={n.id}
                onClick={() => !n.isRead && handleMarkRead(n.id)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                  n.isRead ? 'bg-surface border-border/50 opacity-60' : 'bg-background border-primary/10 shadow-sm'
                }`}
              >
                <div className="flex gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    n.isRead ? 'bg-border/30' : 'bg-primary/10'
                  }`}>
                    {getIcon(n.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-[10px] font-black text-text_muted uppercase tracking-widest">{n.type}</span>
                      <span className="text-[10px] text-text_muted font-medium">
                        {formatDistanceToNow(new Date(n.createdAt))} ago
                      </span>
                    </div>
                    <h4 className="text-sm font-bold truncate text-dark">{n.title}</h4>
                    <p className="text-xs text-text_muted mt-1 line-clamp-2 leading-relaxed">{n.message}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {notifications.length > 0 && (
          <div className="p-4 border-t border-border">
            <button 
              onClick={handleMarkAllRead}
              className="w-full py-3 bg-dark text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-dark/90 transition-all"
            >
              Mark all as read
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationCenter;
