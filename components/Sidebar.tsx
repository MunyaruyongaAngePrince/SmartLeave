import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  CalendarPlus, 
  History, 
  User as UserIcon, 
  LogOut, 
  Menu, 
  X,
  FileText,
  Users,
  Building2
} from 'lucide-react';
import { User, Role } from '../types';

interface SidebarProps {
  user: User;
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ user, onLogout }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const navigate = useNavigate();
  
  const isAdminOrHR = user.role === Role.ADMIN || user.role === Role.HR_MANAGER;

  const handleLogout = () => {
    onLogout();
    navigate('/login');
  };

  const getMenuItems = () => {
    if (isAdminOrHR) {
      return [
        { name: 'Admin Dashboard', path: '/admin', icon: LayoutDashboard },
        { name: 'Leave Management', path: '/leave-manage', icon: FileText },
        { name: 'Employees', path: '/employees', icon: Users },
        { name: 'Departments', path: '/departments', icon: Building2 },
        { name: 'Profile', path: '/profile', icon: UserIcon },
      ];
    }

    return [
      { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
      { name: 'Apply Leave', path: '/apply', icon: CalendarPlus },
      { name: 'Leave History', path: '/history', icon: History },
      { name: 'My Profile', path: '/profile', icon: UserIcon },
    ];
  };

  const menuItems = getMenuItems();

  return (
    <>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-3.5 left-4 z-50 p-2 bg-indigo-600 text-white rounded-xl md:hidden shadow-lg print:hidden"
      >
        {isOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      <div className={`
        fixed inset-y-0 left-0 z-40 w-64 bg-white dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800 transform transition-transform duration-300 ease-in-out print:hidden
        ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0
      `}>
        <div className="flex flex-col h-full">
          {/* Logo Area */}
          <div className="p-6 flex items-center space-x-3 border-b border-gray-50 dark:border-gray-800 h-[73px]">
            <div className="bg-indigo-600 p-2 rounded-lg">
              <CalendarPlus className="text-white" size={20} />
            </div>
            <span className="text-lg font-bold text-gray-800 dark:text-gray-100 tracking-tight">SmartLeave</span>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-8 space-y-1 overflow-y-auto">
            {menuItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setIsOpen(false)}
                className={({ isActive }) => `
                  flex items-center px-4 py-3.5 text-sm font-medium rounded-xl transition-all duration-200
                  ${isActive 
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100 dark:shadow-none' 
                    : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-indigo-600 dark:hover:text-indigo-400'}
                `}
              >
                <item.icon className="mr-3" size={18} />
                {item.name}
              </NavLink>
            ))}
          </nav>

          {/* Logout */}
          <div className="p-4 border-t border-gray-50 dark:border-gray-800">
            <button
              onClick={() => setIsLogoutModalOpen(true)}
              className="flex items-center w-full px-4 py-3.5 text-sm font-bold text-red-500 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors duration-200"
            >
              <LogOut className="mr-3" size={18} />
              Sign Out
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-30 bg-gray-900/20 dark:bg-black/40 backdrop-blur-sm md:hidden print:hidden"
          onClick={() => setIsOpen(false)}
        ></div>
      )}

      {/* Sign Out Confirmation Modal */}
      {isLogoutModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 print:hidden">
          <div 
            className="absolute inset-0 bg-gray-900/40 dark:bg-black/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-300"
            onClick={() => setIsLogoutModalOpen(false)}
          />
          <div className="relative w-full max-w-sm bg-white dark:bg-gray-800 rounded-[32px] shadow-2xl p-8 animate-in zoom-in slide-in-from-bottom-4 duration-300 border border-gray-100 dark:border-gray-700">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <LogOut size={32} />
            </div>
            <div className="text-center mb-8">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Sign Out?</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 leading-relaxed px-2">
                Are you sure you want to sign out? You will need to login again to access the system.
              </p>
            </div>
            <div className="flex flex-col space-y-3">
              <button 
                onClick={handleLogout}
                className="w-full py-3.5 bg-red-600 text-white text-sm font-bold rounded-2xl hover:bg-red-700 shadow-lg shadow-red-100 dark:shadow-none transition-all active:scale-[0.98]"
              >
                Yes, Sign Out
              </button>
              <button 
                onClick={() => setIsLogoutModalOpen(false)}
                className="w-full py-3.5 bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-sm font-bold rounded-2xl hover:bg-gray-100 dark:hover:bg-gray-600 transition-all active:scale-[0.98]"
              >
                No, Stay Logged In
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;