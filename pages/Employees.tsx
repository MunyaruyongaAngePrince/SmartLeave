import React, { useState, useMemo, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { 
  Search, 
  UserPlus, 
  Printer,
  Mail, 
  Phone, 
  Edit, 
  Trash2, 
  Filter, 
  X, 
  User as UserIcon, 
  Briefcase, 
  ShieldCheck,
  CheckCircle2,
  Save,
  ChevronLeft,
  ChevronRight,
  Activity,
  AlertTriangle
} from 'lucide-react';
import { User, Role, AppNotification } from '../types';
import { notificationService } from '../services/notificationService';
import { logError, parseApiError } from '../services/errorHandler';

interface EmployeesProps {
  users: User[];
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
  onAddNotification: (notif: Omit<AppNotification, 'id' | 'time' | 'read'>) => void;
}

const Employees: React.FC<EmployeesProps> = ({ users, setUsers, onAddNotification }) => {
  const location = useLocation();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  
  // Pagination State - Updated to 5 items per page as requested
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Filter State
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [selectedDept, setSelectedDept] = useState('All');
  const [selectedRole, setSelectedRole] = useState('All');

  const departments = ['Engineering', 'Marketing', 'Sales', 'Human Resources', 'Finance', 'Operations', 'Administration'];

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    department: 'Engineering',
    role: Role.EMPLOYEE,
    idNumber: '',
    phoneNumber: '',
    password: ''
  });

  // Handle URL Search Params
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const searchParam = params.get('search');
    if (searchParam) {
      setSearchTerm(searchParam);
      // Automatically open filters if a specific department or role search is needed
      // (Simplified: just setting the search term for now)
    }
  }, [location.search]);

  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const matchesSearch = user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            user.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesDept = selectedDept === 'All' || user.department === selectedDept;
      const matchesRole = selectedRole === 'All' || user.role === selectedRole;
      return matchesSearch && matchesDept && matchesRole;
    });
  }, [searchTerm, users, selectedDept, selectedRole]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedDept, selectedRole]);

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedUsers = filteredUsers.slice(startIndex, startIndex + itemsPerPage);

  const handleOpenAdd = () => {
    setEditingUser(null);
    setFormData({
      fullName: '',
      email: '',
      department: 'Engineering',
      role: Role.EMPLOYEE,
      idNumber: '',
      phoneNumber: '',
      password: ''
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (user: User) => {
    setEditingUser(user);
    setFormData({
      fullName: user.fullName,
      email: user.email,
      department: user.department,
      role: user.role,
      idNumber: user.idNumber || '',
      phoneNumber: user.phoneNumber || '',
      password: '' // Keep empty for edits unless changing
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.fullName.trim()) {
      notificationService.error('Full name is required.');
      return;
    }

    if (!formData.email.trim()) {
      notificationService.error('Email address is required.');
      return;
    }

    // Email validation: Must end with .com
    if (!formData.email.toLowerCase().endsWith('.com')) {
      notificationService.error('Email address must end with .com');
      return;
    }

    // Phone number validation
    if (formData.phoneNumber) {
      const validPrefixes = ['078', '079', '073', '072'];
      const phoneDigits = formData.phoneNumber.replace(/\D/g, '');
      
      if (!validPrefixes.some(prefix => phoneDigits.startsWith(prefix))) {
        notificationService.error('Phone number must start with 078, 079, 073, or 072');
        return;
      }

      if (phoneDigits.length > 10) {
        notificationService.error('Phone number cannot exceed 10 digits');
        return;
      }
    }

    if (formData.idNumber && formData.idNumber.length > 16) {
      notificationService.error('ID Number cannot exceed 16 digits');
      return;
    }

    setIsSaving(true);
    
    try {
      if (editingUser) {
        const token = localStorage.getItem('smart_leave_token');
        const updateData = { ...formData };
        if (!updateData.password) {
          delete (updateData as any).password;
        }
        
        const response = await fetch(`/api/users/${editingUser.id}`, {
          method: 'PUT',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(updateData),
        });

        const data = await response.json();
        
        if (response.ok && data.success) {
          setUsers(prev => prev.map(u => u.id === editingUser.id ? { ...u, ...formData } : u));
          
          // Notify Admins
          const managers = users.filter(u => u.role === Role.ADMIN || u.role === Role.HR_MANAGER);
          managers.forEach(mgr => {
            onAddNotification({
              userId: mgr.id,
              title: 'Employee Updated',
              desc: `${formData.fullName}'s profile has been updated successfully.`,
              type: 'info'
            });
          });

          notificationService.success(`${formData.fullName}'s profile has been updated successfully.`);
          setShowSuccess(true);
          setTimeout(() => { 
            setShowSuccess(false); 
            setIsModalOpen(false); 
          }, 1500);
        } else {
          const errorMsg = data.message || 'Failed to update employee. Please try again.';
          notificationService.error(errorMsg);
          logError({ message: errorMsg, code: 'UPDATE_FAILED', statusCode: 400 }, 'Update employee');
        }
      } else {
        // Create new employee
        if (!formData.password) {
          notificationService.error('Password is required for new employees.');
          setIsSaving(false);
          return;
        }

        if (formData.password.length < 6) {
          notificationService.error('Password must be at least 6 characters long.');
          setIsSaving(false);
          return;
        }

        const newUser = { 
          id: Math.random().toString(36).substr(2, 9), 
          ...formData,
          email: formData.email.toLowerCase(),
        };
        const token = localStorage.getItem('smart_leave_token');
        const response = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(newUser),
        });

        const data = await response.json();

        if (response.ok && data.success) {
          setUsers(prev => [newUser as User, ...prev]);

          // Notify Admins
          const managers = users.filter(u => u.role === Role.ADMIN || u.role === Role.HR_MANAGER);
          managers.forEach(mgr => {
            onAddNotification({
              userId: mgr.id,
              title: 'New Employee Added',
              desc: `${formData.fullName} has been successfully added to the system.`,
              type: 'info'
            });
          });

          notificationService.success(`${formData.fullName} has been successfully added to the system.`);
          setShowSuccess(true);
          setTimeout(() => { 
            setShowSuccess(false); 
            setIsModalOpen(false); 
          }, 1500);
        } else {
          const errorMsg = data.message || 'Failed to create employee. Please try again.';
          notificationService.error(errorMsg);
          logError({ message: errorMsg, code: 'CREATE_FAILED', statusCode: 400 }, 'Create employee');
        }
      }
    } catch (err) {
      const errorDetails = parseApiError(err);
      notificationService.error(errorDetails.message);
      logError(errorDetails, 'Save employee');
    } finally {
      setIsSaving(false);
    }
  };

  const executeDelete = async () => {
    if (deleteConfirmId) {
      try {
        const token = localStorage.getItem('smart_leave_token');
        const response = await fetch(`/api/users/${deleteConfirmId}`, { 
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });

        const data = await response.json();

        if (response.ok && data.success) {
          const deletedUser = users.find(u => u.id === deleteConfirmId);
          setUsers(prev => prev.filter(u => u.id !== deleteConfirmId));

          // Notify Admins
          const managers = users.filter(u => u.role === Role.ADMIN || u.role === Role.HR_MANAGER);
          managers.forEach(mgr => {
            onAddNotification({
              userId: mgr.id,
              title: 'Employee Removed',
              desc: `${deletedUser?.fullName || 'An employee'} has been removed from the system.`,
              type: 'warning'
            });
          });

          notificationService.success(`${deletedUser?.fullName || 'Employee'} has been removed successfully.`);
        } else {
          const errorMsg = data.message || 'Failed to delete employee. Please try again.';
          notificationService.error(errorMsg);
          logError({ message: errorMsg, code: 'DELETE_FAILED', statusCode: 400 }, 'Delete employee');
        }
      } catch (err) {
        const errorDetails = parseApiError(err);
        notificationService.error(errorDetails.message);
        logError(errorDetails, 'Delete employee');
      } finally {
        setDeleteConfirmId(null);
      }
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 pb-20 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Employee Directory</h1>
          <p className="text-gray-500 dark:text-gray-400">View and manage all staff members in the organization</p>
        </div>
        <div className="flex items-center space-x-3 no-print">
          <button 
            onClick={handleOpenAdd}
            className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold flex items-center hover:bg-indigo-700 shadow-lg shadow-indigo-100 dark:shadow-none transition-all active:scale-95"
          >
            <UserPlus className="mr-2" size={18} />
            Add Employee
          </button>
          <button 
            onClick={handlePrint}
            className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold flex items-center hover:bg-indigo-700 shadow-lg shadow-indigo-100 dark:shadow-none transition-all active:scale-95"
          >
            <Printer className="mr-2" size={18} />
            Print List
          </button>
        </div>
      </header>

      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        {/* Search & Filter Trigger */}
        <div className="p-6 border-b border-gray-50 dark:border-gray-700 flex flex-col md:flex-row md:items-center gap-4 bg-gray-50/30 dark:bg-gray-900/10 no-print">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
            />
          </div>
          <button 
            onClick={() => setIsFilterPanelOpen(!isFilterPanelOpen)}
            className={`px-4 py-2.5 border rounded-xl text-sm font-bold flex items-center transition-all ${isFilterPanelOpen ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50'}`}
          >
            <Filter className="mr-2" size={16} />
            Filters
            {(selectedDept !== 'All' || selectedRole !== 'All') && (
              <span className="ml-2 w-1.5 h-1.5 bg-red-500 rounded-full"></span>
            )}
          </button>
        </div>

        {/* Filter Panel */}
        {isFilterPanelOpen && (
          <div className="p-6 bg-gray-50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700 flex flex-wrap gap-6 animate-in slide-in-from-top-4 duration-300 no-print">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Department</label>
              <select 
                value={selectedDept} 
                onChange={(e) => setSelectedDept(e.target.value)} 
                className="block w-48 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs font-bold outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="All">All Departments</option>
                {departments.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Access Role</label>
              <select 
                value={selectedRole} 
                onChange={(e) => setSelectedRole(e.target.value)} 
                className="block w-48 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs font-bold outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="All">All Roles</option>
                {Object.values(Role).map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div className="flex items-end">
              <button 
                onClick={() => { setSelectedDept('All'); setSelectedRole('All'); setSearchTerm(''); }}
                className="mb-1 text-[10px] font-black uppercase text-gray-400 hover:text-red-500 transition-colors"
              >
                Reset Filters
              </button>
            </div>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50/50 dark:bg-gray-900/30 border-b border-gray-100 dark:border-gray-700">
              <tr>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Employee</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Contact Info</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Department</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Role</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest text-right no-print">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
              {paginatedUsers.map((user) => (
                <tr key={user.id} className="hover:bg-indigo-50/30 dark:hover:bg-indigo-900/10 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-400 flex items-center justify-center font-bold mr-3 shadow-sm">
                        {user.fullName.charAt(0)}
                      </div>
                      <p className="text-sm font-bold text-gray-900 dark:text-white">{user.fullName}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-xs font-medium text-gray-600 dark:text-gray-400">{user.email}</span>
                      <span className="text-[10px] text-gray-400 mt-0.5">{user.phoneNumber || 'No phone'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-0.5 rounded uppercase tracking-wider">
                      {user.department}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs font-semibold text-gray-700 dark:text-gray-300">{user.role}</td>
                  <td className="px-6 py-4 text-right no-print">
                    <div className="flex items-center justify-end space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => handleOpenEdit(user)} 
                        className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/40 rounded-lg transition-all"
                        title="Edit Employee"
                      >
                        <Edit size={16} />
                      </button>
                      <button 
                        onClick={() => setDeleteConfirmId(user.id)} 
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/40 rounded-lg transition-all"
                        title="Delete Employee"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {paginatedUsers.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center opacity-40">
                      <UserIcon size={48} className="text-gray-400 mb-4" />
                      <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">No Staff Found</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Enhanced Pagination - Shows if total items > itemsPerPage (5) */}
        {filteredUsers.length > itemsPerPage && (
          <div className="px-6 py-4 bg-gray-50/50 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between no-print">
            <span className="text-xs font-bold text-gray-400">
              Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredUsers.length)} of {filteredUsers.length} entries
            </span>
            <div className="flex items-center space-x-1">
              <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))} 
                disabled={currentPage === 1} 
                className="p-2 bg-white dark:bg-gray-800 rounded-lg disabled:opacity-30 border border-gray-200 dark:border-gray-700 text-gray-500 hover:text-indigo-600 shadow-sm transition-all"
              >
                <ChevronLeft size={16} />
              </button>
              
              <div className="flex space-x-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                      currentPage === page 
                        ? 'bg-indigo-600 text-white shadow-md' 
                        : 'bg-white dark:bg-gray-800 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>

              <button 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} 
                disabled={currentPage === totalPages} 
                className="p-2 bg-white dark:bg-gray-800 rounded-lg disabled:opacity-30 border border-gray-200 dark:border-gray-700 text-gray-500 hover:text-indigo-600 shadow-sm transition-all"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity" onClick={() => !isSaving && setIsModalOpen(false)}></div>
          <div className="relative w-full max-w-md bg-white dark:bg-gray-800 rounded-[24px] shadow-2xl p-6 animate-in zoom-in duration-300 border border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">{editingUser ? 'Update Profile' : 'New Employee'}</h2>
                <p className="text-[10px] text-gray-500 mt-0.5">Fill in the professional details below</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-gray-500"><X size={18} /></button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Full Name</label>
                  <div className="relative">
                    <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input 
                      type="text" 
                      required 
                      value={formData.fullName}
                      onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                      placeholder="e.g.  Ange Prince"
                      className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-transparent focus:border-indigo-500 rounded-xl outline-none transition-all dark:text-white text-sm font-semibold" 
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input 
                      type="email" 
                      required 
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      placeholder="jp@company.com"
                      className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-transparent focus:border-indigo-500 rounded-xl outline-none transition-all dark:text-white text-sm font-semibold" 
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">ID Number</label>
                  <div className="relative">
                    <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input 
                      type="text" 
                      required 
                      value={formData.idNumber}
                      onChange={(e) => setFormData({...formData, idNumber: e.target.value.replace(/\D/g, '').slice(0, 16)})}
                      placeholder="e.g. 1199..."
                      maxLength={16}
                      className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-transparent focus:border-indigo-500 rounded-xl outline-none transition-all dark:text-white text-sm font-semibold" 
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input 
                      type="tel" 
                      required
                      value={formData.phoneNumber}
                      onChange={(e) => setFormData({...formData, phoneNumber: e.target.value.replace(/\D/g, '').slice(0, 10)})}
                      placeholder="078..."
                      maxLength={10}
                      className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-transparent focus:border-indigo-500 rounded-xl outline-none transition-all dark:text-white text-sm font-semibold" 
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Department</label>
                  <div className="relative">
                    <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <select 
                      value={formData.department}
                      onChange={(e) => setFormData({...formData, department: e.target.value})}
                      className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-transparent focus:border-indigo-500 rounded-xl outline-none transition-all dark:text-white text-sm font-semibold appearance-none"
                    >
                      {departments.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">System Role</label>
                  <div className="relative">
                    <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <select 
                      value={formData.role}
                      onChange={(e) => setFormData({...formData, role: e.target.value as Role})}
                      className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-transparent focus:border-indigo-500 rounded-xl outline-none transition-all dark:text-white text-sm font-semibold appearance-none"
                    >
                      {Object.values(Role).map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Password</label>
                <div className="relative">
                  <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input 
                    type="password" 
                    required={!editingUser}
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    placeholder={editingUser ? "Leave blank to keep current" : "Set employee password"}
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-transparent focus:border-indigo-500 rounded-xl outline-none transition-all dark:text-white text-sm font-semibold" 
                  />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={isSaving}
                className="w-full py-3 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-100 dark:shadow-none transition-all flex items-center justify-center active:scale-[0.98] disabled:opacity-50"
              >
                {isSaving ? (
                  <Activity className="animate-spin mr-2" size={20} />
                ) : (
                  <><Save className="mr-2" size={20} /> {editingUser ? 'Save Updates' : 'Add to Organization'}</>
                )}
              </button>
            </form>

            {showSuccess && (
              <div className="absolute inset-0 bg-white/95 dark:bg-gray-800/95 flex flex-col items-center justify-center rounded-[24px] animate-in fade-in duration-300">
                <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 rounded-xl flex items-center justify-center mb-3">
                  <CheckCircle2 size={24} />
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Profile {editingUser ? 'Updated' : 'Created'}!</h3>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={() => setDeleteConfirmId(null)}></div>
          <div className="relative w-full max-w-sm bg-white dark:bg-gray-800 rounded-[32px] shadow-2xl p-8 animate-in zoom-in duration-200 border border-gray-100 dark:border-gray-700">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <AlertTriangle size={32} />
            </div>
            <div className="text-center mb-8">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Remove Employee?</h2>
              <p className="text-xs text-gray-500 mt-2 leading-relaxed">
                This action is permanent. All leave history for this user will remain for auditing but access will be revoked.
              </p>
            </div>
            <div className="flex flex-col space-y-3">
              <button 
                onClick={executeDelete}
                className="w-full py-3.5 bg-red-600 text-white text-sm font-bold rounded-2xl hover:bg-red-700 shadow-lg shadow-red-100 dark:shadow-none transition-all active:scale-[0.98]"
              >
                Confirm Removal
              </button>
              <button 
                onClick={() => setDeleteConfirmId(null)}
                className="w-full py-3.5 bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-sm font-bold rounded-2xl hover:bg-gray-100 dark:hover:bg-gray-600 transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Employees;