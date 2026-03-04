import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Bell, ChevronDown, CheckCheck, Info, XCircle, Moon, Sun, AlertCircle } from 'lucide-react';
import { User, AppNotification } from '../types';

interface TopbarProps {
  user: User;
  notifications: AppNotification[];
  onMarkAllRead: () => void;
}

const Topbar: React.FC<TopbarProps> = ({ user, notifications, onMarkAllRead }) => {
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return document.documentElement.classList.contains('dark') || 
           localStorage.getItem('theme') === 'dark';
  });
  const notificationRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter(n => !n.read).length;

  // Determine greeting based on time of day
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 18 ? 'Good Afternoon' : 'Good Evening';

  // Toggle Dark Mode
  const toggleDarkMode = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    if (newMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  // Initialize theme on mount
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggleNotifications = () => {
    const nextState = !isNotificationsOpen;
    setIsNotificationsOpen(nextState);
    
    // If opening the dropdown, clear the badge count by marking all as read
    if (nextState && unreadCount > 0) {
      onMarkAllRead();
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'success': return { icon: CheckCheck, color: 'text-emerald-500', bg: 'bg-emerald-50' };
      case 'error': return { icon: XCircle, color: 'text-red-500', bg: 'bg-red-50' };
      case 'warning': return { icon: AlertCircle, color: 'text-amber-500', bg: 'bg-amber-50' };
      default: return { icon: Info, color: 'text-indigo-500', bg: 'bg-indigo-50' };
    }
  };

  return (
    <header className="sticky top-0 z-30 w-full bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 px-4 md:px-8 h-[73px] flex items-center transition-colors duration-300 print:hidden">
      <div className="flex items-center justify-between w-full max-w-7xl mx-auto">
        {/* Left Side: Welcome Greeting */}
        <div className="hidden md:flex items-center flex-1">
          <div>
            <h2 className="text-sm font-bold text-gray-800 dark:text-gray-100">{greeting}, {user.fullName.split(' ')[0]}!</h2>
            <p className="text-[10px] text-gray-400 dark:text-gray-500 font-medium uppercase tracking-wider">System Operational • {new Date().toLocaleDateString('en-RW', { weekday: 'long', day: 'numeric', month: 'short' })}</p>
          </div>
        </div>

        {/* Right Side: Actions & Profile */}
        <div className="flex items-center space-x-2 md:space-x-3 ml-auto">
          {/* Dark Mode Toggle */}
          <button 
            onClick={toggleDarkMode}
            className="p-2 rounded-xl text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-indigo-600 transition-all"
            title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>

          {/* Notifications Dropdown Container */}
          <div className="relative" ref={notificationRef}>
            <button 
              onClick={handleToggleNotifications}
              className={`relative p-2 rounded-xl transition-all ${isNotificationsOpen ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600' : 'text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-indigo-600'}`}
            >
              <Bell size={20} />
              {unreadCount > 0 && !isNotificationsOpen && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-600 border-2 border-white dark:border-gray-900 rounded-full text-[10px] text-white flex items-center justify-center font-black px-1 animate-in zoom-in">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* Notification Dropdown */}
            {isNotificationsOpen && (
              <div className="absolute right-0 mt-3 w-80 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="p-4 border-b border-gray-50 dark:border-gray-700 flex items-center justify-between bg-gray-50/50 dark:bg-gray-700/50">
                  <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">Notifications</h3>
                  <span className="text-[10px] font-bold text-gray-400">Activity Log</span>
                </div>
                <div className="max-h-[360px] overflow-y-auto">
                  {notifications.slice(0, 3).length > 0 ? (
                    <>
                      {notifications.slice(0, 3).map((n) => {
                        const iconData = getIcon(n.type);
                        return (
                          <div key={n.id} className={`p-4 border-b border-gray-50 dark:border-gray-700 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer group`}>
                            <div className="flex items-start space-x-3">
                              <div className={`mt-0.5 w-8 h-8 ${iconData.bg} dark:bg-gray-700 ${iconData.color} rounded-lg flex items-center justify-center shrink-0`}>
                                <iconData.icon size={16} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-0.5">
                                  <p className="text-xs font-bold text-gray-900 dark:text-gray-100 truncate">{n.title}</p>
                                  <span className="text-[9px] text-gray-400 font-medium">{n.time}</span>
                                </div>
                                <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed line-clamp-2">{n.desc}</p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </>
                  ) : (
                    <div className="p-8 text-center">
                      <p className="text-xs text-gray-400 italic">No notifications yet</p>
                    </div>
                  )}
                </div>
                <div className="p-3 bg-gray-50/50 dark:bg-gray-700/50 text-center">
                  <Link 
                    to="/notifications" 
                    onClick={() => setIsNotificationsOpen(false)}
                    className="text-xs font-bold text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                  >
                    View All Activities
                  </Link>
                </div>
              </div>
            )}
          </div>
          
          {/* Profile Section */}
          <Link 
            to="/profile"
            className="flex items-center pl-2 md:pl-5 border-l border-gray-100 dark:border-gray-800 hover:opacity-80 transition-opacity group"
          >
            <div className="flex flex-col items-end mr-3">
              <span className="text-xs font-bold text-gray-900 dark:text-gray-100 group-hover:text-indigo-600 transition-colors">{user.fullName}</span>
              <span className={`text-[10px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded ${
                user.role.includes('Admin') ? 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30' : 
                user.role.includes('HR') ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30' : 'text-amber-600 bg-amber-50 dark:bg-amber-900/30'
              }`}>
                {user.role}
              </span>
            </div>
            <div className="relative cursor-pointer">
              <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold shadow-md shadow-indigo-100 group-hover:scale-105 transition-transform overflow-hidden">
                {user.avatar ? (
                  <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  user.fullName.charAt(0)
                )}
              </div>
              <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-emerald-500 border-2 border-white dark:border-gray-900 rounded-full"></div>
            </div>
            <div className="ml-1 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors">
              <ChevronDown size={14} />
            </div>
          </Link>
        </div>
      </div>
    </header>
  );
};

export default Topbar;