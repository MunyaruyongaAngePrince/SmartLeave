
import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  Briefcase, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Calendar as CalendarIcon,
  TrendingUp,
  Gift,
  ArrowRight,
  Info
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { User, LeaveRequest, EncashmentRequest, LeaveStatus, LeaveCategory, LeaveBalance } from '../types';

interface EmployeeDashboardProps {
  user: User;
  leaves: LeaveRequest[];
  encashments: EncashmentRequest[];
  holidays: any[];
  balances: LeaveBalance[];
}

const EmployeeDashboard: React.FC<EmployeeDashboardProps> = ({ user, leaves, encashments, holidays, balances }) => {
  const userLeaves = leaves.filter(l => l.userId === user.id);
  const userEncashments = encashments.filter(e => e.userId === user.id);
  
  // Helper to calculate days between two dates
  const calculateDays = (start: string, end: string) => {
    const s = new Date(start);
    const e = new Date(end);
    const diff = Math.ceil((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    return isNaN(diff) ? 0 : diff;
  };

  // Calculate total approved days to get a realistic balance
  const totalApprovedDays = userLeaves
    .filter(l => l.status === LeaveStatus.APPROVED)
    .reduce((sum, l) => sum + calculateDays(l.startDate, l.endDate), 0);

  const annualBalance = balances.find(b => b.category === 'Annual Leave')?.balance ?? 21;

  const stats = {
    total: userLeaves.length + userEncashments.length,
    pending: userLeaves.filter(l => l.status === LeaveStatus.PENDING).length + userEncashments.filter(e => e.status === LeaveStatus.PENDING).length,
    approved: userLeaves.filter(l => l.status === LeaveStatus.APPROVED).length + userEncashments.filter(e => e.status === LeaveStatus.APPROVED).length,
    rejected: userLeaves.filter(l => l.status === LeaveStatus.REJECTED).length + userEncashments.filter(e => e.status === LeaveStatus.REJECTED).length,
    annualBalance: annualBalance,
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const targetLeave = useMemo(() => {
    return userLeaves
      .filter(l => l.status === LeaveStatus.APPROVED)
      .map(l => {
        const end = new Date(l.endDate);
        end.setHours(0, 0, 0, 0);
        return { ...l, endDateObj: end };
      })
      .filter(l => l.endDateObj >= today)
      .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())[0];
  }, [userLeaves, today]);

  const remainingInfo = useMemo(() => {
    if (targetLeave) {
      const diff = Math.ceil((targetLeave.endDateObj.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return {
        val: diff,
        label: 'Leave Ends In',
        unit: 'Days Remaining'
      };
    } else {
      const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      const diff = Math.ceil((endOfMonth.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return {
        val: diff,
        label: 'Month Ends In',
        unit: 'Days Remaining'
      };
    }
  }, [targetLeave, today]);

  const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  const categoryData = useMemo(() => {
    const data: { name: string; value: number }[] = Object.values(LeaveCategory).map(cat => ({
      name: cat,
      value: userLeaves.filter(l => l.category === cat).length
    }));
    
    const encashmentCount = userEncashments.length;
    if (encashmentCount > 0) {
      data.push({
        name: 'Sell Leave (Encashment)',
        value: encashmentCount
      });
    }
    
    return data.filter(d => d.value > 0);
  }, [userLeaves, userEncashments]);

  // Generate dynamic month data up to current month
  const monthData = useMemo(() => {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    return monthNames.slice(0, currentMonth + 1).map((name, index) => {
      const leaveCount = userLeaves.filter(leave => {
        const leaveDate = new Date(leave.startDate);
        return (
          leaveDate.getMonth() === index && 
          leaveDate.getFullYear() === currentYear
        );
      }).length;

      const encashmentCount = userEncashments.filter(e => {
        const eDate = new Date(e.appliedDate);
        return (
          eDate.getMonth() === index &&
          eDate.getFullYear() === currentYear
        );
      }).length;
      
      return { name, count: leaveCount + encashmentCount };
    });
  }, [userLeaves, userEncashments]);

  const unifiedActivities = useMemo(() => {
    const combined = [
      ...userLeaves.map(l => ({ ...l, displayCategory: l.category, displayDate: `${l.startDate} to ${l.endDate}` })),
      ...userEncashments.map(e => ({ 
        ...e, 
        displayCategory: 'Sell Leave (Encashment)', 
        displayDate: `Applied on ${e.appliedDate} (${e.daysToSell} days)` 
      }))
    ];
    return combined.sort((a, b) => new Date(b.appliedDate).getTime() - new Date(a.appliedDate).getTime());
  }, [userLeaves, userEncashments]);

  const upcomingHolidays = useMemo(() => {
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
      <header>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Welcome, {user.fullName}</h1>
        <p className="text-gray-500 dark:text-gray-400">Here's your leave overview and upcoming organization dates</p>
      </header>

      {/* Quick Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: 'Total Leaves', val: stats.total, unit: 'Requests', icon: Briefcase, color: 'indigo' },
          { label: 'Pending', val: stats.pending, unit: 'Waiting', icon: Clock, color: 'yellow' },
          { label: 'Approved', val: stats.approved, unit: 'Requests', icon: CheckCircle, color: 'emerald' },
          { label: 'Rejected', val: stats.rejected, unit: 'Requests', icon: XCircle, color: 'red' },
          { label: remainingInfo.label, val: remainingInfo.val, unit: remainingInfo.unit, icon: TrendingUp, color: 'blue' }
        ].map((card, i) => (
          <div key={i} className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col items-center justify-center text-center hover:shadow-md transition-all group">
            <div className={`p-2 bg-${card.color}-50 dark:bg-${card.color}-900/20 text-${card.color}-600 dark:text-${card.color}-400 rounded-lg mb-2 group-hover:scale-110 transition-transform`}>
              <card.icon size={20} />
            </div>
            <span className="text-2xl font-bold text-gray-900 dark:text-white">{card.val}</span>
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">{card.label}</span>
              <span className="text-[8px] font-bold text-indigo-400 dark:text-indigo-500 uppercase mt-0.5">{card.unit}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 flex items-center">
              <TrendingUp className="mr-2 text-indigo-600 dark:text-indigo-400" size={20} />
              Leave Requests Distribution
            </h3>
            <div className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest bg-gray-50 dark:bg-gray-700/50 px-2 py-1 rounded">
              YTD Analytics
            </div>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} allowDecimals={false} />
                <Tooltip 
                  cursor={{fill: '#374151'}}
                  contentStyle={{ 
                    borderRadius: '12px', 
                    border: 'none', 
                    boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
                    backgroundColor: '#1f2937'
                  }}
                  itemStyle={{ fontSize: '12px', fontWeight: 'bold', color: '#818cf8' }}
                />
                <Bar dataKey="count" fill="#4f46e5" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700">
          <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4">Leave Types</h3>
          <div className="h-[250px]">
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400 dark:text-gray-500 text-sm italic">
                No leave data to display
              </div>
            )}
          </div>
          <div className="mt-4 space-y-2">
            {categoryData.map((item, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: COLORS[i % COLORS.length] }}></div>
                  <span className="text-gray-600 dark:text-gray-300">{item.name}</span>
                </div>
                <span className="font-bold text-gray-900 dark:text-white">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 flex items-center">
              <CalendarIcon className="mr-2 text-indigo-600 dark:text-indigo-400" size={20} />
              Recent Leave Status
            </h3>
            <Link 
              to="/history" 
              className="text-xs font-bold text-indigo-600 dark:text-indigo-400 flex items-center hover:text-indigo-800 dark:hover:text-indigo-300 transition-colors"
            >
              View History
              <ArrowRight size={14} className="ml-1" />
            </Link>
          </div>
          <div className="space-y-4">
            {unifiedActivities.slice(0, 4).map((activity: any) => (
              <div key={activity.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-2xl">
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">{activity.displayCategory}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{activity.displayDate}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                  activity.status === LeaveStatus.APPROVED ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' :
                  activity.status === LeaveStatus.REJECTED ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' :
                  'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                }`}>
                  {activity.status}
                </span>
              </div>
            ))}
            {unifiedActivities.length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-400 dark:text-gray-500 text-sm italic">No leave requests found.</p>
                <Link to="/apply" className="text-xs font-bold text-indigo-600 dark:text-indigo-400 mt-2 inline-block hover:underline">Apply for Leave Now</Link>
              </div>
            )}
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
              View Full Calendar
              <ArrowRight size={14} className="ml-1" />
            </Link>
          </div>
          <div className="space-y-4 flex-1">
            {upcomingHolidays.length > 0 ? (
              upcomingHolidays.map((holiday) => (
                <div key={holiday.id} className="flex items-center p-3 border-b border-gray-50 dark:border-gray-700 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-xl transition-colors relative">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center mr-4 flex-shrink-0 ${isSoon(holiday.date) ? 'bg-indigo-600 text-white animate-pulse' : 'bg-pink-50 dark:bg-pink-900/20 text-pink-500 dark:text-pink-400'}`}>
                    <CalendarIcon size={18} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">{holiday.name}</p>
                      {isSoon(holiday.date) && (
                        <span className="ml-2 px-1.5 py-0.5 bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 text-[8px] font-black uppercase rounded">Coming Soon</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{new Date(holiday.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <Info className="text-gray-300 dark:text-gray-600 mb-2" size={32} />
                <p className="text-gray-400 dark:text-gray-500 text-sm">No more holidays scheduled for this year.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeDashboard;
