import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { User, Role, LeaveRequest, EncashmentRequest, PensionRequest, AppNotification, Department, LeaveBalance } from './types';
import { MOCK_LEAVES, MOCK_DEPARTMENTS } from './constants';
import { notificationService, handleErrorNotification } from './services/notificationService';
import { parseApiError, logError } from './services/errorHandler';

// Components
import ToastContainer from './components/ToastContainer';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import EmployeeDashboard from './pages/EmployeeDashboard';
import AdminDashboard from './pages/AdminDashboard';
import LeaveManage from './pages/LeaveManage';
import PensionManage from './pages/PensionManage';
import Employees from './pages/Employees';
import Departments from './pages/Departments';
import ApplyLeave from './pages/ApplyLeave';
import PensionRequestPage from './pages/PensionRequest';
import PensionHistory from './pages/PensionHistory';
import LeaveHistory from './pages/LeaveHistory';
import Profile from './pages/Profile';
import Holidays from './pages/Holidays';
import Notifications from './pages/Notifications';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('smart_leave_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [users, setUsers] = useState<User[]>([]);

  const [departments, setDepartments] = useState<Department[]>([]);

  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [balances, setBalances] = useState<LeaveBalance[]>([]);
  const [encashments, setEncashments] = useState<EncashmentRequest[]>([]);
  const [pensions, setPensions] = useState<PensionRequest[]>([]);

  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [holidays, setHolidays] = useState<any[]>([]);

  const formatNotificationTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const kigaliTime = new Date(date.toLocaleString('en-US', { timeZone: 'Africa/Kigali' }));
    const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'Africa/Kigali' }));
    const diffMs = now.getTime() - kigaliTime.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) {
      const isToday = kigaliTime.getDate() === now.getDate() && 
                      kigaliTime.getMonth() === now.getMonth() && 
                      kigaliTime.getFullYear() === now.getFullYear();
      if (isToday) {
        return `Today at ${kigaliTime.toLocaleTimeString('en-RW', { hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Kigali' })}`;
      }
    }
    if (diffDays === 1) return `Yesterday at ${kigaliTime.toLocaleTimeString('en-RW', { hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Kigali' })}`;
    
    return kigaliTime.toLocaleDateString('en-RW', { 
      day: 'numeric', 
      month: 'short', 
      hour: '2-digit', 
      minute: '2-digit',
      timeZone: 'Africa/Kigali'
    });
  };

  const fetchNotifications = async () => {
    if (!currentUser) return;
    const token = localStorage.getItem('smart_leave_token');
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
    
    try {
      const res = await fetch(`/api/notifications/${currentUser.id}`, { headers });
      
      if (!res.ok) {
        throw new Error(`Failed to fetch notifications (${res.status})`);
      }

      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setNotifications(data.data.map((n: any) => ({
          ...n,
          desc: n.description,
          time: formatNotificationTime(n.created_at),
          read: !!n.is_read
        })));
      }
    } catch (err) {
      const errorDetails = parseApiError(err);
      logError(errorDetails, 'Fetch notifications');
      // Don't show notification error - it's not critical
    }
  };

  useEffect(() => {
    if (!currentUser) return;

    const token = localStorage.getItem('smart_leave_token');
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

    // Helper to fetch and handle errors
    const fetchData = async (url: string, onSuccess: (data: any) => void, label: string) => {
      try {
        const res = await fetch(url, { headers });
        
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(errorData.message || `Failed to fetch ${label}`);
        }

        const data = await res.json();
        const dataArray = data.data || data;
        if (Array.isArray(dataArray)) {
          onSuccess(dataArray);
        }
      } catch (err) {
        const errorDetails = parseApiError(err);
        logError(errorDetails, `Fetch ${label}`);
        // Only show toast for critical data, not all fetches
        if (label === 'leave requests' || label === 'users') {
          handleErrorNotification(errorDetails.message);
        }
      }
    };

    // Fetch users if admin
    if (currentUser.role === Role.ADMIN || currentUser.role === Role.HR_MANAGER) {
      fetchData('/api/users', setUsers, 'users');
    }

    // Fetch departments
    fetchData('/api/departments', setDepartments, 'departments');

    // Fetch leaves
    fetchData('/api/leaves', setLeaves, 'leave requests');

    // Fetch encashments
    fetchData('/api/encashments', setEncashments, 'encashments');

    // Fetch pensions
    fetchData('/api/pensions', setPensions, 'pension requests');

    // Fetch balances
    fetchData(`/api/balances/${currentUser.id}`, setBalances, 'leave balances');

    // Fetch holidays
    fetchData('/api/holidays', setHolidays, 'holidays');

    // Initial notifications fetch
    fetchNotifications();

    // Set up polling for notifications (every 15 seconds)
    const pollInterval = setInterval(fetchNotifications, 15000);

    return () => clearInterval(pollInterval);
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem('smart_leave_requests', JSON.stringify(leaves));
  }, [leaves]);

  useEffect(() => {
    localStorage.setItem('smart_leave_encashments', JSON.stringify(encashments));
  }, [encashments]);

  useEffect(() => {
    localStorage.setItem('smart_leave_pensions', JSON.stringify(pensions));
  }, [pensions]);

  useEffect(() => {
    localStorage.setItem('smart_leave_users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem('smart_leave_departments', JSON.stringify(departments));
  }, [departments]);

  useEffect(() => {
    localStorage.setItem('smart_leave_notifications', JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('smart_leave_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('smart_leave_user');
    }
  }, [currentUser]);

  // Initial Dark Mode Check
  useEffect(() => {
    if (localStorage.getItem('theme') === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const handleLogin = (user: User, token?: string) => {
    setCurrentUser(user);
    if (token) localStorage.setItem('smart_leave_token', token);
  };
  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('smart_leave_token');
  };
  
  const handleUpdateUser = (updatedUser: User) => {
    setCurrentUser(updatedUser);
    setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
  };

  const addNotification = async (notif: Omit<AppNotification, 'id' | 'time' | 'read'>) => {
    const newNotif = {
      ...notif,
      id: Math.random().toString(36).substr(2, 9),
      description: notif.desc, // map frontend field to DB field
    };

    try {
      await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newNotif),
      });

      // Refresh notifications if for current user
      if (currentUser && notif.userId === currentUser.id) {
        fetchNotifications();
      }
    } catch (err) {
      console.error('Failed to add notification:', err);
    }
  };

  const markAllRead = async () => {
    if (!currentUser) return;
    try {
      await fetch(`/api/notifications/read-all/${currentUser.id}`, { method: 'PATCH' });
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (err) {
      console.error('Failed to mark all read:', err);
    }
  };

  const isAdminOrHR = currentUser?.role === Role.ADMIN || currentUser?.role === Role.HR_MANAGER;

  return (
    <HashRouter>
      <ToastContainer />
      <div className="flex h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-300 overflow-hidden">
        {currentUser && <Sidebar user={currentUser} onLogout={handleLogout} />}
        
        <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${currentUser ? 'ml-0 md:ml-64' : ''}`}>
          {currentUser && (
            <Topbar 
              user={currentUser} 
              notifications={notifications.filter(n => n.userId === currentUser.id)} 
              onMarkAllRead={markAllRead}
            />
          )}
          
          <main className="flex-1 overflow-y-auto focus:outline-none dark:bg-gray-900/50">
            <Routes>
              <Route 
                path="/" 
                element={currentUser ? (isAdminOrHR ? <Navigate to="/admin" /> : <Navigate to="/dashboard" />) : <Home />} 
              />
              
              <Route 
                path="/login" 
                element={!currentUser ? <Login onLogin={handleLogin} /> : <Navigate to="/" />} 
              />
              
              <Route 
                path="/register" 
                element={!currentUser ? <Register setUsers={setUsers} onAddNotification={addNotification} users={users} /> : <Navigate to="/" />} 
              />

              <Route 
                path="/dashboard" 
                element={currentUser && !isAdminOrHR ? <EmployeeDashboard user={currentUser} leaves={leaves} encashments={encashments} holidays={holidays} balances={balances} /> : <Navigate to="/login" />} 
              />
              <Route 
                path="/apply" 
                element={currentUser && !isAdminOrHR ? (
                  <ApplyLeave 
                    user={currentUser} 
                    leaves={leaves} 
                    setLeaves={setLeaves} 
                    encashments={encashments} 
                    setEncashments={setEncashments} 
                    onAddNotification={addNotification}
                    users={users}
                  />
                ) : <Navigate to="/login" />} 
              />
              <Route 
                path="/pension" 
                element={currentUser && !isAdminOrHR ? (
                  <PensionRequestPage 
                    user={currentUser} 
                    pensions={pensions} 
                    setPensions={setPensions} 
                    onAddNotification={addNotification}
                    users={users}
                  />
                ) : <Navigate to="/login" />} 
              />
              <Route 
                path="/history" 
                element={currentUser && !isAdminOrHR ? <LeaveHistory user={currentUser} leaves={leaves} encashments={encashments} /> : <Navigate to="/login" />} 
              />
              <Route 
                path="/pension-history" 
                element={currentUser && !isAdminOrHR ? <PensionHistory user={currentUser} pensions={pensions} /> : <Navigate to="/login" />} 
              />
              <Route 
                path="/holidays" 
                element={currentUser ? <Holidays user={currentUser} leaves={leaves} holidays={holidays} /> : <Navigate to="/login" />} 
              />

              <Route 
                path="/profile" 
                element={currentUser ? <Profile user={currentUser} onUpdateUser={handleUpdateUser} /> : <Navigate to="/login" />} 
              />

              <Route 
                path="/notifications" 
                element={currentUser ? (
                  <Notifications 
                    notifications={notifications.filter(n => n.userId === currentUser.id)} 
                    onMarkAllRead={markAllRead} 
                  />
                ) : <Navigate to="/login" />} 
              />

              <Route 
                path="/admin" 
                element={currentUser && isAdminOrHR ? <AdminDashboard leaves={leaves} encashments={encashments} users={users} departments={departments} holidays={holidays} /> : <Navigate to="/login" />} 
              />
              <Route 
                path="/leave-manage" 
                element={currentUser && (currentUser.role === Role.HR_MANAGER || currentUser.role === Role.ADMIN) ? (
                  <LeaveManage 
                    user={currentUser}
                    leaves={leaves} 
                    setLeaves={setLeaves} 
                    encashments={encashments} 
                    setEncashments={setEncashments} 
                    onAddNotification={addNotification}
                    users={users}
                  />
                ) : <Navigate to="/login" />} 
              />
              <Route 
                path="/pension-manage" 
                element={currentUser && (currentUser.role === Role.HR_MANAGER || currentUser.role === Role.ADMIN) ? (
                  <PensionManage 
                    user={currentUser}
                    pensions={pensions} 
                    setPensions={setPensions} 
                    onAddNotification={addNotification}
                    users={users}
                  />
                ) : <Navigate to="/login" />} 
              />
              <Route 
                path="/employees" 
                element={currentUser && isAdminOrHR ? <Employees users={users} setUsers={setUsers} onAddNotification={addNotification} /> : <Navigate to="/login" />} 
              />
              <Route 
                path="/departments" 
                element={currentUser && isAdminOrHR ? (
                  <Departments 
                    users={users} 
                    departments={departments}
                    setDepartments={setDepartments}
                    leaves={leaves} 
                    setLeaves={setLeaves} 
                    onAddNotification={addNotification} 
                  />
                ) : <Navigate to="/login" />} 
              />

              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </main>
        </div>
      </div>
    </HashRouter>
  );
};

export default App;