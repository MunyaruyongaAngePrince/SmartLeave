
import React, { useState, useMemo } from 'react';
import { 
  Bell, 
  Search, 
  Filter, 
  CheckCheck, 
  Info, 
  XCircle, 
  AlertCircle, 
  Trash2, 
  ChevronLeft, 
  ChevronRight,
  Clock
} from 'lucide-react';
import { AppNotification } from '../types';

interface NotificationsProps {
  notifications: AppNotification[];
  onMarkAllRead: () => void;
}

const Notifications: React.FC<NotificationsProps> = ({ notifications, onMarkAllRead }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('All');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const filteredNotifications = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    return notifications.filter(n => {
      const title = (n.title || '').toLowerCase();
      const desc = (n.desc || '').toLowerCase();
      const matchesSearch = title.includes(term) || desc.includes(term);
      const matchesType = typeFilter === 'All' || n.type === typeFilter;
      return matchesSearch && matchesType;
    });
  }, [notifications, searchTerm, typeFilter]);

  const totalPages = Math.ceil(filteredNotifications.length / itemsPerPage);
  const paginatedNotifications = filteredNotifications.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const getIcon = (type: string) => {
    switch (type) {
      case 'success': return { icon: CheckCheck, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/20' };
      case 'error': return { icon: XCircle, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-900/20' };
      case 'warning': return { icon: AlertCircle, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/20' };
      default: return { icon: Info, color: 'text-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-900/20' };
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-8 pb-20 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
            <Bell className="mr-3 text-indigo-600 dark:text-indigo-400" size={24} />
            All Notifications
          </h1>
          <p className="text-gray-500 dark:text-gray-400">Stay updated with your latest activities and system alerts</p>
        </div>
        <button 
          onClick={onMarkAllRead}
          className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold flex items-center hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 dark:shadow-none active:scale-95"
        >
          <CheckCheck className="mr-2" size={18} />
          Mark All as Read
        </button>
      </header>

      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="p-6 border-b border-gray-50 dark:border-gray-700 flex flex-col md:flex-row items-center gap-4 bg-gray-50/30 dark:bg-gray-900/20">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Search notifications..." 
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500" 
            />
          </div>
          <div className="flex items-center space-x-2 w-full md:w-auto">
            <Filter className="text-gray-400" size={18} />
            <select 
              value={typeFilter}
              onChange={(e) => { setTypeFilter(e.target.value); setCurrentPage(1); }}
              className="flex-1 md:w-40 px-4 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="All">All Types</option>
              <option value="success">Success</option>
              <option value="info">Information</option>
              <option value="warning">Warning</option>
              <option value="error">Error</option>
            </select>
          </div>
        </div>

        <div className="divide-y divide-gray-50 dark:divide-gray-700">
          {paginatedNotifications.length > 0 ? (
            paginatedNotifications.map((n) => {
              const iconData = getIcon(n.type);
              return (
                <div key={n.id} className={`p-6 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors group ${!n.read ? 'bg-indigo-50/10 dark:bg-indigo-900/5' : ''}`}>
                  <div className="flex items-start space-x-4">
                    <div className={`w-10 h-10 ${iconData.bg} ${iconData.color} rounded-2xl flex items-center justify-center shrink-0 shadow-sm`}>
                      <iconData.icon size={20} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className={`text-sm font-bold text-gray-900 dark:text-white ${!n.read ? 'text-indigo-600 dark:text-indigo-400' : ''}`}>
                          {n.title}
                          {!n.read && <span className="ml-2 w-1.5 h-1.5 bg-indigo-600 rounded-full inline-block"></span>}
                        </h4>
                        <div className="flex items-center text-[10px] text-gray-400 font-medium">
                          <Clock size={12} className="mr-1" />
                          {n.time}
                        </div>
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                        {n.desc}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-20 text-center">
              <div className="w-16 h-16 bg-gray-50 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300 dark:text-gray-600">
                <Bell size={32} />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">No notifications found</h3>
              <p className="text-gray-500 dark:text-gray-400 mt-1">Try adjusting your search or filters</p>
            </div>
          )}
        </div>

        {totalPages > 1 && (
          <div className="p-6 bg-gray-50/50 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
            <span className="text-xs font-bold text-gray-400">
              Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredNotifications.length)} of {filteredNotifications.length}
            </span>
            <div className="flex items-center space-x-2">
              <button 
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                className="p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl disabled:opacity-30 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all shadow-sm"
              >
                <ChevronLeft size={18} />
              </button>
              <button 
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                className="p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl disabled:opacity-30 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all shadow-sm"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;
