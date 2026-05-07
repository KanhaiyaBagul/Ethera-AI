import { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import {
  LayoutDashboard, FolderKanban, CheckSquare, LogOut, Zap,
  Search, Bell, Settings, Plus
} from 'lucide-react';
import ThemeToggle from '../ui/ThemeToggle';
import SearchModal from '../ui/SearchModal';
import NotificationCenter from './NotificationCenter';
import { getNotifications } from '../../api/notification.api';

const Sidebar = () => {
  const { user, logout } = useAuth();
  const [showSearch, setShowSearch] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const fetchUnread = async () => {
      try {
        const res = await getNotifications();
        const unread = res.data.notifications.filter(n => !n.isRead).length;
        setUnreadCount(unread);
      } catch (err) {
        // Silently fail
      }
    };

    fetchUnread();
    const interval = setInterval(fetchUnread, 30000); // Poll every 30s
    return () => clearInterval(interval);
  }, []);

  const navItems = [
    { name: 'Dashboard', path: '/', icon: <LayoutDashboard size={18} />, end: true },
    { name: 'Projects', path: '/projects', icon: <FolderKanban size={18} />, end: false },
    { name: 'My Tasks', path: '/tasks', icon: <CheckSquare size={18} />, end: false },
  ];

  return (
    <>
      <div className="w-64 bg-surface border-r border-border h-screen flex flex-col fixed left-0 top-0 z-40">
        {/* Logo */}
        <div className="p-6 pb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-dark rounded-xl flex items-center justify-center">
              <Zap size={16} className="text-accent" />
            </div>
            <span className="text-xl font-heading font-bold text-dark tracking-tight">Flōw</span>
          </div>
          <div className="mt-1 ml-10 flex items-center justify-between">
            <span className="text-[10px] text-text_muted font-black tracking-widest uppercase">PRO Workspace</span>
            <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
          </div>
        </div>

        {/* Global Action Section */}
        <div className="px-6 mb-6 space-y-2">
          <button
            onClick={() => setShowSearch(true)}
            className="w-full flex items-center gap-3 px-4 py-2.5 bg-background border border-border rounded-2xl text-text_muted hover:text-text_primary transition-all text-xs font-medium group"
          >
            <Search size={14} className="group-hover:text-primary transition-colors" />
            <span>Search...</span>
            <kbd className="ml-auto text-[10px] font-black opacity-30">Ctrl K</kbd>
          </button>
        </div>

        {/* Nav */}
        <div className="flex-1 px-3 space-y-1">
          <p className="px-4 mb-3 text-[10px] font-black text-text_muted uppercase tracking-widest opacity-50">Menu</p>
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-300 text-sm font-bold ${isActive
                  ? 'bg-dark text-white shadow-xl shadow-dark/10'
                  : 'text-text_muted hover:bg-background hover:text-text_primary'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span className={`flex items-center justify-center w-8 h-8 rounded-xl transition-all ${isActive ? 'bg-accent text-dark rotate-12 scale-110' : 'bg-background text-text_muted group-hover:rotate-6'
                    }`}>
                    {item.icon}
                  </span>
                  <span>{item.name}</span>
                </>
              )}
            </NavLink>
          ))}

          <button 
            onClick={() => setShowNotifications(true)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-text_muted hover:bg-background hover:text-text_primary transition-all text-sm font-bold group"
          >
            <span className="flex items-center justify-center w-8 h-8 rounded-xl bg-background group-hover:rotate-6 transition-all">
              <Bell size={18} className={unreadCount > 0 ? 'text-primary animate-bounce' : ''} />
            </span>
            <span>Notifications</span>
            {unreadCount > 0 && (
              <div className="ml-auto w-5 h-5 bg-primary text-[10px] text-white rounded-full flex items-center justify-center font-black ring-4 ring-surface">
                {unreadCount}
              </div>
            )}
          </button>
        </div>

        {/* User Footer */}
        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-3 px-3 py-3 mb-1 rounded-2xl hover:bg-background transition-all group">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-white font-black text-xs ring-2 ring-primary/20 group-hover:rotate-12 transition-all">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-text_primary truncate">{user?.name}</p>
              <p className="text-[10px] text-text_muted truncate font-medium">{user?.email}</p>
            </div>
            <ThemeToggle />
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-3 py-2.5 text-text_muted hover:bg-danger/5 hover:text-danger rounded-xl transition-colors text-sm font-bold group"
          >
            <span className="flex items-center justify-center w-8 h-8 rounded-xl bg-background group-hover:-rotate-12 transition-all">
              <LogOut size={16} />
            </span>
            <span>Logout</span>
          </button>
        </div>
      </div>

      <SearchModal isOpen={showSearch} onClose={() => setShowSearch(false)} />
      <NotificationCenter isOpen={showNotifications} onClose={() => setShowNotifications(false)} />
    </>
  );
};

export default Sidebar;
