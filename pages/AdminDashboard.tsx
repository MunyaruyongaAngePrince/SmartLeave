
import React from 'react';
import { 
  Users, 
  Layers, 
  FileText, 
  Clock,
  TrendingUp,
  AlertCircle,
  Calendar,
  Activity,
  Database,
  CheckCircle2,
  XCircle,
  Gift,
  ArrowRight,
  Info
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  Legend
} from 'recharts';
import { LeaveRequest, EncashmentRequest, LeaveStatus, User, Department, LeaveCategory } from '../types';

interface AdminDashboardProps {
  leaves: LeaveRequest[];
  encashments: EncashmentRequest[];
  users: User[];
  departments: Department[];
  holidays: any[];
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ leaves, encashments, users, departments, holidays }) => {
  const [dbStatus, setDbStatus] = React.useState<{ status: string; users: number; leaves: number; engine: string } | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    fetch('/api/health')
      .then(res => res.json())
      .then(data => {
        if (data.status === 'ok') {
          setDbStatus({
            status: 'Connected',
            users: data.db.users,
            leaves: data.db.leaves,
            engine: data.engine || 'MySQL'
          });
        } else {
          setDbStatus({ status: 'Error', users: 0, leaves: 0, engine: 'Unknown' });
        }
      })
      .catch(() => setDbStatus({ status: 'Disconnected', users: 0, leaves: 0, engine: 'Unknown' }))
      .finally(() => setLoading(false));
  }, []);

  const pendingLeaves = leaves.filter(l => l.status === LeaveStatus.PENDING).length;
  const pendingEncashments = encashments.filter(e => e.status === LeaveStatus.PENDING).length;
  
  const now = new Date();
  const currentMonthName = now.toLocaleString('default', { month: 'long' });

  // Dynamic stats based on actual system state
  const stats = {
    totalEmployees: users.length,
    totalDepts: departments.length,
    monthlyLeaves: leaves.filter(l => {
      const d = new Date(l.appliedDate);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length + encashments.filter(e => {
      const d = new Date(e.appliedDate);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length,
    activeLeaves: leaves.filter(l => l.status === LeaveStatus.APPROVED).length + encashments.filter(e => e.status === LeaveStatus.APPROVED).length
  };

  // 1. Create a map of userId to department name for quick lookup
  const userDeptMap = users.reduce((acc: Record<string, string>, user) => {
    acc[user.id] = user.department;
    return acc;
  }, {});

  // 2. Count leave requests by department (including encashments)
  const leaveDeptCounts = React.useMemo(() => {
    const counts: Record<string, number> = {};
    leaves.forEach(l => {
      const deptName = userDeptMap[l.userId] || 'Unknown';
      counts[deptName] = (counts[deptName] || 0) + 1;
    });
    encashments.forEach(e => {
      const deptName = userDeptMap[e.userId] || 'Unknown';
      counts[deptName] = (counts[deptName] || 0) + 1;
    });
    return counts;
  }, [leaves, encashments, userDeptMap]);

  // 3. Format data for the chart, ensuring all departments are represented
  const deptData = React.useMemo(() => {
    return departments.map(dept => ({
      name: dept.name.length > 8 ? dept.name.substring(0, 7) + '..' : dept.name,
      fullName: dept.name,
      count: leaveDeptCounts[dept.name] || 0
    })).sort((a, b) => b.count - a.count);
  }, [departments, leaveDeptCounts]);

  // 4. Count leave requests by category
  const categoryData = React.useMemo(() => {
    const data: { name: string; value: number }[] = Object.values(LeaveCategory).map(cat => ({
      name: cat,
      value: leaves.filter(l => l.category === cat).length
    }));
    
    if (encashments.length > 0) {
      data.push({
        name: 'Sell Leave (Encashment)',
        value: encashments.length
      });
    }
    
    return data.filter(d => d.value > 0);
  }, [leaves, encashments]);

  const unifiedActivity = React.useMemo(() => {
    const combined = [
      ...leaves.map(l => ({ ...l, displayCategory: l.category })),
      ...encashments.map(e => ({ ...e, displayCategory: 'Sell Leave (Encashment)' }))
    ];
    return combined.sort((a, b) => new Date(b.appliedDate).getTime() - new Date(a.appliedDate).getTime());
  }, [leaves, encashments]);

  const COLORS = ['#1e3a8a', '#1d4ed8', '#2563eb', '#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe', '#dbeafe'];
  const PIE_COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  const upcomingHolidays = React.useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return holidays
      .filter(h => new Date(h.date) >= today)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 3);
  }, [holidays]);

  const isSoon = (dateStr: string) => {
    const holidayDate = new Date(dateStr);
    const today = new Date();
    const diffTime = holidayDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= 7;
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 pb-20 animate-in fade-in duration-500">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Management Center</h1>
          <p className="text-gray-500 dark:text-gray-400">Global organizational overview and leave utilization tracking</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden md:flex bg-indigo-50 dark:bg-indigo-900/20 px-4 py-2 rounded-2xl border border-indigo-100 dark:border-indigo-800 items-center">
            <Activity size={16} className="text-indigo-600 mr-2 animate-pulse" />
            <span className="text-xs font-bold text-indigo-700 dark:text-indigo-300 uppercase">Live Operations</span>
          </div>
        </div>
      </header>

      {/* Action Alerts */}
      {(pendingLeaves > 0 || pendingEncashments > 0) && (
        <div className="bg-indigo-600 dark:bg-indigo-700 rounded-3xl p-6 text-white flex flex-col md:flex-row items-center justify-between shadow-xl shadow-indigo-100 dark:shadow-none transition-all">
          <div className="flex items-center mb-4 md:mb-0 text-center md:text-left">
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mr-4">
              <AlertCircle size={24} />
            </div>
            <div>
              <h3 className="text-lg font-bold">Pending Items Require Attention</h3>
              <p className="text-indigo-100 text-sm">There are {pendingLeaves + pendingEncashments} new requests waiting for processing.</p>
            </div>
          </div>
          <button 
            onClick={() => window.location.hash = '#/leave-manage'}
            className="px-6 py-3 bg-white text-indigo-600 dark:text-indigo-800 font-bold rounded-xl hover:bg-indigo-50 transition-all text-sm active:scale-95"
          >
            Review Requests
          </button>
        </div>
      )}

      {/* Admin Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col hover:shadow-md transition-all group">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110">
              <Users size={22} />
            </div>
            {dbStatus?.status === 'Connected' ? (
              <CheckCircle2 size={16} className="text-emerald-500" />
            ) : (
              <XCircle size={16} className="text-red-500 animate-pulse" />
            )}
          </div>
          <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Total Workforce</p>
          <div className="flex items-baseline gap-2">
            <p className="text-3xl font-black text-gray-900 dark:text-white mt-1">{stats.totalEmployees}</p>
            <span className="text-[10px] text-gray-400 font-medium">({dbStatus?.users || 0} in DB)</span>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col hover:shadow-md transition-all group">
          <div className="w-12 h-12 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110">
            <Layers size={22} />
          </div>
          <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Departments</p>
          <p className="text-3xl font-black text-gray-900 dark:text-white mt-1">{stats.totalDepts}</p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col hover:shadow-md transition-all group relative">
          <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110">
            <FileText size={22} />
          </div>
          <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Monthly Leaves</p>
          <p className="text-3xl font-black text-gray-900 dark:text-white mt-1">{stats.monthlyLeaves}</p>
          <span className="absolute top-6 right-6 px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 text-[9px] font-black uppercase rounded">
            {currentMonthName}
          </span>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col hover:shadow-md transition-all group">
          <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110">
            <Activity size={22} />
          </div>
          <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Active Personnel</p>
          <p className="text-xl font-black text-gray-900 dark:text-white mt-1">{stats.totalEmployees}</p>
          <div className="mt-2 flex items-center gap-1.5">
            <div className={`w-2 h-2 rounded-full ${dbStatus?.status === 'Connected' ? 'bg-emerald-500' : 'bg-red-500 animate-pulse'}`}></div>
            <span className="text-[10px] font-bold text-gray-500 uppercase">{dbStatus?.status === 'Connected' ? 'System Online' : 'System Offline'}</span>
          </div>
        </div>
      </div>

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-bold text-gray-800 dark:text-white flex items-center">
              <TrendingUp className="mr-2 text-indigo-600 dark:text-indigo-400" size={20} />
              Leave Requests by Department
            </h3>
            <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-1 rounded">Departmental Utilization</span>
          </div>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={deptData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} allowDecimals={false} />
                <Tooltip 
                  cursor={{fill: '#374151'}}
                  contentStyle={{ 
                    borderRadius: '12px', 
                    border: 'none', 
                    boxShadow: '0 10px 15px -3px rgba(0,0,0,0.2)',
                    backgroundColor: '#1f2937',
                    color: '#f3f4f6'
                  }}
                  itemStyle={{ color: '#818cf8' }}
                  labelStyle={{ fontWeight: 'bold', marginBottom: '4px' }}
                  formatter={(value: number) => [`${value} Requests`, 'Total Leaves']}
                />
                <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                  {deptData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-bold text-gray-800 dark:text-white flex items-center">
              <Activity className="mr-2 text-indigo-600 dark:text-indigo-400" size={20} />
              Leave Types Distribution
            </h3>
            <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-1 rounded">Category Breakdown</span>
          </div>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 10}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} allowDecimals={false} />
                <Tooltip 
                  cursor={{fill: '#374151'}}
                  contentStyle={{ 
                    borderRadius: '12px', 
                    border: 'none', 
                    boxShadow: '0 10px 15px -3px rgba(0,0,0,0.2)',
                    backgroundColor: '#1f2937',
                    color: '#f3f4f6'
                  }}
                  itemStyle={{ color: '#818cf8' }}
                  labelStyle={{ fontWeight: 'bold', marginBottom: '4px' }}
                  formatter={(value: number) => [`${value} Requests`, 'Total Leaves']}
                />
                <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 flex items-center">
              <Activity className="mr-2 text-indigo-600 dark:text-indigo-400" size={20} />
              Recent System Activity
            </h3>
            <Link 
              to="/leave-manage"
              className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest bg-indigo-50 dark:bg-indigo-900/30 px-2 py-1 rounded hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors"
            >
              view Requests
            </Link>
          </div>
          <div className="space-y-4">
            {unifiedActivity.slice(0, 3).map((activity: any) => (
              <div key={activity.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-2xl">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-400 flex items-center justify-center text-sm font-black">
                    {activity.fullName.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">{activity.fullName}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{activity.displayCategory} • {activity.appliedDate}</p>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${
                  activity.status === LeaveStatus.APPROVED ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' :
                  activity.status === LeaveStatus.REJECTED ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' :
                  'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                }`}>
                  {activity.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col h-full">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 flex items-center">
              <Gift className="mr-2 text-pink-500 dark:text-pink-400" size={20} />
              Upcoming Holidays
            </h3>
            <Link 
              to="/holidays" 
              className="text-xs font-bold text-indigo-600 dark:text-indigo-400 flex items-center hover:text-indigo-800 dark:hover:text-indigo-300 transition-colors"
            >
              Calendar
              <ArrowRight size={14} className="ml-1" />
            </Link>
          </div>
          <div className="space-y-4 flex-1">
            {upcomingHolidays.length > 0 ? (
              upcomingHolidays.map((holiday) => (
                <div key={holiday.id} className="flex items-center p-3 border-b border-gray-50 dark:border-gray-700 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-xl transition-colors relative">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center mr-4 flex-shrink-0 ${isSoon(holiday.date) ? 'bg-indigo-600 text-white animate-pulse' : 'bg-pink-50 dark:bg-pink-900/20 text-pink-500 dark:text-pink-400'}`}>
                    <Calendar size={18} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">{holiday.name}</p>
                      {isSoon(holiday.date) && (
                        <span className="ml-2 px-1.5 py-0.5 bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 text-[8px] font-black uppercase rounded">Soon</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{new Date(holiday.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <Info className="text-gray-300 dark:text-gray-600 mb-2" size={32} />
                <p className="text-gray-400 dark:text-gray-500 text-sm">No upcoming holidays.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
