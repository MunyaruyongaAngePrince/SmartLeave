import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Building2, 
  Users, 
  Crown, 
  ArrowUpRight, 
  Plus, 
  X, 
  Edit3, 
  CheckCircle2, 
  Save,
  ChevronLeft,
  ChevronRight,
  Search,
  Calendar,
  Activity,
  ArrowRight,
  Printer,
  CalendarPlus,
  ToggleLeft,
  Trash2,
  AlertTriangle
} from 'lucide-react';
import { User, LeaveRequest, LeaveStatus, LeaveCategory, AppNotification, Department } from '../types';

interface DepartmentsProps {
  users: User[];
  departments: Department[];
  setDepartments: React.Dispatch<React.SetStateAction<Department[]>>;
  leaves: LeaveRequest[];
  setLeaves: React.Dispatch<React.SetStateAction<LeaveRequest[]>>;
  onAddNotification: (notif: Omit<AppNotification, 'id' | 'time' | 'read'>) => void;
}

const Departments: React.FC<DepartmentsProps> = ({ users, departments, setDepartments, leaves, setLeaves, onAddNotification }) => {
  const navigate = useNavigate();
  
  const departmentList = [
    'Engineering', 'Marketing', 'Sales', 'Human Resources', 
    'Finance', 'Operations', 'Administration', 'Quality Assurance',
    'Customer Support', 'IT Infrastructure'
  ];

  const [viewingDeptId, setViewingDeptId] = useState<string | null>(null);
  const [rosterSearchTerm, setRosterSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  
  const [isDeleteMode, setIsDeleteMode] = useState(false);
  const [deptToDelete, setDeptToDelete] = useState<Department | null>(null);

  const [rosterPage, setRosterPage] = useState(1);
  const rosterItemsPerPage = 5;

  const [formData, setFormData] = useState({
    name: '',
    head: '',
    status: 'Active' as 'Active' | 'Inactive'
  });

  const [assignForm, setAssignForm] = useState({
    employeeId: 'all',
    category: LeaveCategory.ANNUAL,
    startDate: '',
    endDate: '',
    reason: ''
  });

  const viewingDept = departments.find(d => d.id === viewingDeptId);

  // Helper to get real-time member count for any department
  const getMemberCount = (deptName: string) => {
    return users.filter(u => u.department === deptName).length;
  };

  const departmentUsers = useMemo(() => {
    if (!viewingDept) return [];
    return users.filter(u => u.department === viewingDept.name);
  }, [viewingDept, users]);

  const filteredRoster = useMemo(() => {
    return departmentUsers.filter(member => 
      member.fullName.toLowerCase().includes(rosterSearchTerm.toLowerCase()) ||
      member.email.toLowerCase().includes(rosterSearchTerm.toLowerCase())
    );
  }, [departmentUsers, rosterSearchTerm]);

  useEffect(() => {
    setRosterPage(1);
  }, [rosterSearchTerm]);

  const totalRosterPages = Math.ceil(filteredRoster.length / rosterItemsPerPage);
  const paginatedRoster = filteredRoster.slice(
    (rosterPage - 1) * rosterItemsPerPage,
    rosterPage * rosterItemsPerPage
  );

  const handleOpenAdd = () => {
    setEditingDept(null);
    setFormData({ name: departmentList[0], head: users[0]?.fullName || '', status: 'Active' });
    setIsModalOpen(true);
    setIsDeleteMode(false);
  };

  const handleOpenEdit = (dept: Department) => {
    setEditingDept(dept);
    setFormData({ 
      name: dept.name, 
      head: dept.head, 
      status: dept.status 
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation: One person cannot lead more than one unit
    const isAlreadyLeading = departments.some(d => 
      d.head.toLowerCase().trim() === formData.head.toLowerCase().trim() && 
      (!editingDept || d.id !== editingDept.id)
    );

    if (isAlreadyLeading) {
      onAddNotification({
        title: 'Validation Error',
        desc: `❌ ${formData.head} is already leading another department. Each unit must have a unique lead.`,
        type: 'error'
      });
      return;
    }

    // Validation: Lead must be a member of the department
    const leadUser = users.find(u => u.fullName === formData.head);
    if (!leadUser || leadUser.department !== formData.name) {
      onAddNotification({
        title: 'Validation Error',
        desc: `❌ ${formData.head} must be a member of the ${formData.name} department to be its lead.`,
        type: 'error'
      });
      return;
    }

    setIsSaving(true);

    try {
      if (editingDept) {
        // Update existing department
        const token = localStorage.getItem('smart_leave_token');
        const response = await fetch(`/api/departments/${editingDept.id}`, {
          method: 'PUT',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({...formData}),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to update department');
        }

        setDepartments(prev => prev.map(d => d.id === editingDept.id ? { ...d, ...formData } : d));

        onAddNotification({
          title: 'Success',
          desc: `✓ Department "${formData.name}" has been updated successfully.`,
          type: 'success'
        });
      } else {
        // Create new department
        const newDept: Department = {
          id: Math.random().toString(36).substr(2, 9),
          ...formData,
          members: 0
        };
        const token = localStorage.getItem('smart_leave_token');
        const response = await fetch('/api/departments', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(newDept),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to create department');
        }

        setDepartments(prev => [newDept, ...prev]);

        onAddNotification({
          title: 'Success',
          desc: `✓ New department "${formData.name}" has been created successfully.`,
          type: 'success'
        });
      }

      setIsSaving(false);
      setShowSuccess(true);
      
      setTimeout(() => {
        setShowSuccess(false);
        setIsModalOpen(false);
      }, 1500);
    } catch (err) {
      console.error('Failed to save department:', err);
      const errorMsg = err instanceof Error ? err.message : 'An error occurred. Please try again.';
      
      onAddNotification({
        title: 'Error',
        desc: `❌ ${errorMsg}`,
        type: 'error'
      });

      setIsSaving(false);
    }
  };

  const confirmDelete = (e: React.MouseEvent, dept: Department) => {
    e.stopPropagation();
    setDeptToDelete(dept);
  };

  const executeDelete = async () => {
    if (deptToDelete) {
      try {
        const token = localStorage.getItem('smart_leave_token');
        const response = await fetch(`/api/departments/${deptToDelete.id}`, { 
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          setDepartments(prev => prev.filter(d => d.id !== deptToDelete.id));
          if (viewingDeptId === deptToDelete.id) {
            setViewingDeptId(null);
          }
        }
      } catch (err) {
        console.error('Failed to delete department:', err);
      } finally {
        setDeptToDelete(null);
      }
    }
  };

  const handleAssignLeave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    const targetEmployees = assignForm.employeeId === 'all' 
      ? departmentUsers 
      : users.filter(u => u.id === assignForm.employeeId);

    if (targetEmployees.length === 0) {
      setIsSaving(false);
      return;
    }

    const newRequests: LeaveRequest[] = targetEmployees.map(emp => ({
      id: Math.random().toString(36).substr(2, 9),
      userId: emp.id,
      fullName: emp.fullName,
      category: assignForm.category,
      startDate: assignForm.startDate,
      endDate: assignForm.endDate,
      reason: assignForm.reason,
      status: LeaveStatus.APPROVED,
      appliedDate: new Date().toISOString().split('T')[0]
    }));

    // Persist to backend
    Promise.all(newRequests.map(req => 
      fetch('/api/leaves', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req)
      })
    )).then(() => {
      setLeaves(prev => [...newRequests, ...prev]);

      targetEmployees.forEach(emp => {
        onAddNotification({
          userId: emp.id,
          title: 'Leave Assigned',
          desc: `HR has assigned you ${assignForm.category} from ${assignForm.startDate} to ${assignForm.endDate}.`,
          type: 'info'
        });
      });

      setIsSaving(false);
      setShowSuccess(true);
      
      setTimeout(() => {
        setShowSuccess(false);
        setIsAssignModalOpen(false);
        setAssignForm({
          employeeId: 'all',
          category: LeaveCategory.ANNUAL,
          startDate: '',
          endDate: '',
          reason: ''
        });
      }, 1500);
    }).catch(err => {
      console.error('Failed to assign leaves:', err);
      setIsSaving(false);
      alert('Failed to assign leaves. Please try again.');
    });
  };

  const handlePrint = () => {
    window.print();
  };

  const navigateToEmployee = (fullName: string) => {
    navigate(`/employees?search=${encodeURIComponent(fullName)}`);
  };

  if (viewingDeptId && viewingDept) {
    const realCount = getMemberCount(viewingDept.name);
    return (
      <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 pb-20 animate-in fade-in duration-300">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => { setViewingDeptId(null); setRosterSearchTerm(''); }}
              className="p-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-gray-500 dark:text-gray-400 shadow-sm"
            >
              <ChevronLeft size={20} />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{viewingDept.name} Department</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
                <Building2 size={14} className="mr-1" /> Organizational Unit • {realCount} Personnel
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3 print:hidden">
             <button 
                onClick={() => handleOpenEdit(viewingDept)}
                className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 rounded-xl text-sm font-bold flex items-center hover:bg-gray-50 dark:hover:bg-gray-700 transition-all shadow-sm"
              >
                <Edit3 className="mr-2 text-indigo-600 dark:text-indigo-400" size={18} />
                Edit Unit
              </button>
              <button 
                onClick={() => setIsAssignModalOpen(true)}
                className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold flex items-center hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 dark:shadow-none"
              >
                <CalendarPlus className="mr-2" size={18} />
                Assign Leave
              </button>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white dark:bg-gray-800 p-5 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm">
                <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase mb-1">Active Leaves</p>
                <div className="flex items-end justify-between">
                  <span className="text-2xl font-black text-gray-900 dark:text-white">
                    {leaves.filter(l => l.status === LeaveStatus.APPROVED && departmentUsers.some(u => u.id === l.userId)).length}
                  </span>
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 p-5 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm">
                <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase mb-1">Total Staff</p>
                <div className="flex items-end justify-between">
                  <span className="text-2xl font-black text-gray-900 dark:text-white">{realCount}</span>
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 p-5 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm">
                <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase mb-1">Status</p>
                <div className="flex items-end justify-between">
                  <span className={`text-2xl font-black ${viewingDept.status === 'Active' ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-500'}`}>{viewingDept.status}</span>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-50 dark:border-gray-700 flex items-center justify-between print:hidden">
                <h3 className="text-lg font-bold text-gray-800 dark:text-white flex items-center">
                  <Users className="mr-2 text-indigo-600 dark:text-indigo-400" size={20} />
                  Unit Roster
                </h3>
                <div className="flex items-center space-x-2">
                  <div className="relative">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
                    <input 
                      type="text" 
                      placeholder="Filter team..." 
                      value={rosterSearchTerm}
                      onChange={(e) => setRosterSearchTerm(e.target.value)}
                      className="pl-9 pr-4 py-1.5 bg-gray-50 dark:bg-gray-900 border-none rounded-lg text-xs text-gray-900 dark:text-white outline-none focus:ring-1 focus:ring-indigo-500 w-48 transition-all" 
                    />
                  </div>
                  <button 
                    onClick={() => window.print()}
                    className="p-1.5 bg-gray-50 dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 rounded-lg hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                    title="Print Roster"
                  >
                    <Printer size={16} />
                  </button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-gray-50/50 dark:bg-gray-900/50">
                      <th className="px-6 py-3 text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Employee</th>
                      <th className="px-6 py-3 text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Contact</th>
                      <th className="px-6 py-3 text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Role</th>
                      <th className="px-6 py-3 text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest print:hidden"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                    {paginatedRoster.map(member => (
                      <tr key={member.id} className="hover:bg-indigo-50/30 dark:hover:bg-indigo-900/10 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-400 flex items-center justify-center text-xs font-black">
                              {member.fullName.charAt(0)}
                            </div>
                            <span className="text-sm font-bold text-gray-900 dark:text-white">{member.fullName}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-xs text-gray-600 dark:text-gray-400">{member.email}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-md text-[9px] font-black uppercase bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-400`}>
                            {member.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right print:hidden">
                          <button 
                            onClick={() => navigateToEmployee(member.fullName)}
                            className="p-1.5 text-gray-400 dark:text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 opacity-0 group-hover:opacity-100 transition-all"
                            title="View Employee Account"
                          >
                            <ArrowRight size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Edit Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
            <div className="relative w-full max-w-md bg-white dark:bg-gray-800 rounded-[32px] shadow-2xl p-8 animate-in zoom-in duration-300">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">{editingDept ? 'Update' : 'Create'} Unit</h2>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors text-gray-500"><X size={20} /></button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-xs font-black uppercase text-gray-400 mb-2">Department Name</label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input 
                      type="text"
                      list="dept-suggestions"
                      required 
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      placeholder="Type or select department..."
                      className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-900 border border-transparent focus:border-indigo-500 rounded-xl outline-none transition-all dark:text-white font-semibold" 
                    />
                    <datalist id="dept-suggestions">
                      {departmentList.map(dept => <option key={dept} value={dept} />)}
                    </datalist>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-black uppercase text-gray-400 mb-2">Department Lead</label>
                  <div className="relative">
                    <Crown className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <select 
                      required 
                      value={formData.head}
                      onChange={(e) => setFormData({...formData, head: e.target.value})}
                      className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-900 border border-transparent focus:border-indigo-500 rounded-xl outline-none transition-all dark:text-white font-semibold appearance-none" 
                    >
                      <option value="">Select a lead from {formData.name}...</option>
                      {users.filter(u => u.department === formData.name).map(u => (
                        <option key={u.id} value={u.fullName}>{u.fullName}</option>
                      ))}
                    </select>
                  </div>
                  {users.filter(u => u.department === formData.name).length === 0 && (
                    <p className="text-[10px] text-red-500 mt-1 font-bold">No personnel found in {formData.name} department yet.</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-black uppercase text-gray-400 mb-2">Status</label>
                  <div className="relative">
                    <ToggleLeft className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <select 
                      value={formData.status}
                      onChange={(e) => setFormData({...formData, status: e.target.value as 'Active' | 'Inactive'})}
                      className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-900 border border-transparent focus:border-indigo-500 rounded-xl outline-none appearance-none font-semibold dark:text-white"
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-4 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-2xl text-sm font-bold hover:bg-gray-200 dark:hover:bg-gray-600 transition-all">Cancel</button>
                  <button type="submit" disabled={isSaving} className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl text-sm font-bold hover:bg-indigo-700 transition-all flex items-center justify-center">
                    {isSaving ? <Activity className="animate-spin" size={20} /> : <><Save className="mr-2" size={20} /> Save</>}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Assign Leave Modal */}
        {isAssignModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => setIsAssignModalOpen(false)}></div>
            <div className="relative w-full max-w-md bg-white dark:bg-gray-800 rounded-[32px] shadow-2xl p-8 animate-in zoom-in duration-300">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Assign Leave</h2>
                <button onClick={() => setIsAssignModalOpen(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors text-gray-500"><X size={20} /></button>
              </div>

              <form onSubmit={handleAssignLeave} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-black uppercase text-gray-400 mb-2">Department</label>
                    <div className="relative group">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400 pointer-events-none z-10">
                        <Building2 size={18} />
                      </span>
                      <select 
                        required 
                        value={assignForm.employeeId}
                        onChange={(e) => setAssignForm({...assignForm, employeeId: e.target.value})}
                        className="w-full pl-10 pr-10 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white text-sm font-semibold appearance-none cursor-pointer hover:border-gray-300 dark:hover:border-gray-600 transition-colors" 
                      >
                        <option value="all">All Staff</option>
                        {departmentUsers.map(u => <option key={u.id} value={u.id}>{u.fullName}</option>)}
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                        </svg>
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-black uppercase text-gray-400 mb-2">Category</label>
                    <div className="relative group">
                      <select 
                        required 
                        value={assignForm.category}
                        onChange={(e) => setAssignForm({...assignForm, category: e.target.value as LeaveCategory})}
                        className="w-full px-4 py-3 pr-10 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white text-sm font-semibold appearance-none cursor-pointer hover:border-gray-300 dark:hover:border-gray-600 transition-colors" 
                      >
                        {Object.values(LeaveCategory).map(cat => <option key={cat} value={cat}>{cat}</option>)}
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-black uppercase text-gray-400 mb-2">Start Date</label>
                    <input 
                      type="date" 
                      required 
                      value={assignForm.startDate}
                      onChange={(e) => setAssignForm({...assignForm, startDate: e.target.value})}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-transparent focus:border-indigo-500 rounded-xl outline-none transition-all dark:text-white text-sm font-semibold" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black uppercase text-gray-400 mb-2">End Date</label>
                    <input 
                      type="date" 
                      required 
                      value={assignForm.endDate}
                      onChange={(e) => setAssignForm({...assignForm, endDate: e.target.value})}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-transparent focus:border-indigo-500 rounded-xl outline-none transition-all dark:text-white text-sm font-semibold" 
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-black uppercase text-gray-400 mb-2">HR Note</label>
                  <textarea 
                    required 
                    rows={3}
                    value={assignForm.reason}
                    onChange={(e) => setAssignForm({...assignForm, reason: e.target.value})}
                    placeholder="Brief reason..."
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-transparent focus:border-indigo-500 rounded-xl outline-none transition-all dark:text-white text-sm font-semibold resize-none"
                  ></textarea>
                </div>

                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setIsAssignModalOpen(false)} className="flex-1 py-4 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-2xl text-sm font-bold hover:bg-gray-200 dark:hover:bg-gray-600 transition-all">Cancel</button>
                  <button type="submit" disabled={isSaving} className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl text-sm font-bold hover:bg-indigo-700 transition-all flex items-center justify-center">
                    {isSaving ? <Activity className="animate-spin" size={20} /> : <><CheckCircle2 className="mr-2" size={20} /> Assign Now</>}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 pb-20 animate-in fade-in duration-300">
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Organizational Units</h1>
          <p className="text-gray-500 dark:text-gray-400">Manage departments and assign departmental leads</p>
        </div>
        <div className="flex items-center space-x-3">
          <button 
            onClick={() => setIsDeleteMode(!isDeleteMode)}
            className={`px-6 py-2.5 rounded-xl text-sm font-bold flex items-center transition-all ${isDeleteMode ? 'bg-red-600 text-white shadow-lg shadow-red-100' : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-red-600 dark:text-red-400 hover:bg-red-50'}`}
          >
            {isDeleteMode ? <><X className="mr-2" size={18} /> Done Deleting</> : <><Trash2 className="mr-2" size={18} /> Delete Unit</>}
          </button>
          <button 
            onClick={handleOpenAdd}
            className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold flex items-center hover:bg-indigo-700 shadow-lg shadow-indigo-100 dark:shadow-none transition-all"
          >
            <Plus className="mr-2" size={18} />
            New Unit
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {departments.map((dept) => {
          const realCount = getMemberCount(dept.name);
          return (
            <div 
              key={dept.id} 
              onClick={() => !isDeleteMode && setViewingDeptId(dept.id)}
              className={`bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 transition-all group relative ${isDeleteMode ? 'cursor-default ring-2 ring-red-100 dark:ring-red-900/30' : 'cursor-pointer hover:shadow-md'}`}
            >
              {isDeleteMode && (
                <button 
                  onClick={(e) => confirmDelete(e, dept)}
                  className="absolute -top-3 -right-3 w-8 h-8 bg-red-600 text-white rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform animate-in zoom-in"
                >
                  <Trash2 size={16} />
                </button>
              )}

              <div className="flex items-center justify-between mb-6">
                <div className={`w-12 h-12 ${dept.status === 'Active' ? 'bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600' : 'bg-gray-50 dark:bg-gray-900 text-gray-400'} rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110`}>
                  <Building2 size={24} />
                </div>
                {!isDeleteMode && <ArrowUpRight className="text-gray-400 hover:text-indigo-600" size={20} />}
              </div>
              
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">{dept.name}</h3>
              <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest flex items-center">
                <span className={`w-2 h-2 rounded-full mr-2 ${dept.status === 'Active' ? 'bg-emerald-500' : 'bg-gray-300'}`}></span>
                {dept.status} Status
              </p>

              <div className="mt-8 space-y-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900/50 rounded-xl">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Dept. Lead</span>
                  <span className="text-sm font-bold text-gray-900 dark:text-gray-100">{dept.head}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900/50 rounded-xl">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Actual Members</span>
                  <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">{realCount}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Delete Confirmation Modal */}
      {deptToDelete && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={() => setDeptToDelete(null)}></div>
          <div className="relative w-full max-w-sm bg-white dark:bg-gray-800 rounded-[32px] shadow-2xl p-8 animate-in zoom-in duration-200 border border-gray-100 dark:border-gray-700 text-center">
            <AlertTriangle className="text-red-600 mx-auto mb-6" size={32} />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Delete {deptToDelete.name}?</h2>
            <p className="text-xs text-gray-500 mt-2 leading-relaxed">This unit will be removed, but personnel will remain in system.</p>
            <div className="mt-8 flex flex-col space-y-3">
              <button onClick={executeDelete} className="w-full py-3.5 bg-red-600 text-white text-sm font-bold rounded-2xl">Confirm Delete</button>
              <button onClick={() => setDeptToDelete(null)} className="w-full py-3.5 bg-gray-50 dark:bg-gray-700 text-gray-600 text-sm font-bold rounded-2xl">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {isModalOpen && !viewingDeptId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
          <div className="relative w-full max-w-md bg-white dark:bg-gray-800 rounded-[32px] shadow-2xl p-8 animate-in zoom-in duration-300">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Create New Unit</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-500"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-xs font-black uppercase text-gray-400 mb-2">Department Name</label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input 
                    type="text"
                    list="new-dept-suggestions"
                    required 
                    value={formData.name} 
                    onChange={(e) => setFormData({...formData, name: e.target.value})} 
                    placeholder="Type or select department..."
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-900 rounded-xl outline-none font-semibold dark:text-white border border-transparent focus:border-indigo-500"
                  />
                  <datalist id="new-dept-suggestions">
                    {departmentList.map(dept => <option key={dept} value={dept} />)}
                  </datalist>
                </div>
              </div>
              <div>
                <label className="block text-xs font-black uppercase text-gray-400 mb-2">Department Lead</label>
                <div className="relative group">
                  <Crown className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none z-10" size={18} />
                  <select 
                    required 
                    value={formData.head} 
                    onChange={(e) => setFormData({...formData, head: e.target.value})} 
                    className="w-full pl-10 pr-10 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none font-semibold dark:text-white focus:ring-2 focus:ring-indigo-500 appearance-none cursor-pointer hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
                  >
                    <option value="">Select a lead from {formData.name}...</option>
                    {users.filter(u => u.department === formData.name).map(u => (
                      <option key={u.id} value={u.fullName}>{u.fullName}</option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                    </svg>
                  </div>
                </div>
                {users.filter(u => u.department === formData.name).length === 0 && (
                  <p className="text-[10px] text-red-500 mt-1 font-bold">No personnel found in {formData.name} department yet.</p>
                )}
              </div>
              <div>
                <label className="block text-xs font-black uppercase text-gray-400 mb-2">Status</label>
                <div className="relative group">
                  <select 
                    value={formData.status} 
                    onChange={(e) => setFormData({...formData, status: e.target.value as 'Active' | 'Inactive'})} 
                    className="w-full px-4 pr-10 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none font-semibold dark:text-white focus:ring-2 focus:ring-indigo-500 appearance-none cursor-pointer hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                    </svg>
                  </div>
                </div>
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-4 bg-gray-100 text-gray-600 rounded-2xl text-sm font-bold">Cancel</button>
                <button type="submit" disabled={isSaving} className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl text-sm font-bold hover:bg-indigo-700 transition-all flex items-center justify-center">
                  {isSaving ? <Activity className="animate-spin" size={20} /> : <><Plus className="mr-2" size={20} /> Create</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Departments;