import React, { useState, useMemo, useEffect } from 'react';
import { 
  Search, 
  CheckCircle, 
  XCircle, 
  ChevronLeft,
  ChevronRight,
  Filter,
  X,
  FileSpreadsheet,
  Printer,
  FileText,
  Eye,
  Paperclip,
  Download
} from 'lucide-react';
import { LeaveRequest, EncashmentRequest, LeaveStatus, LeaveCategory, AppNotification, User } from '../types';

interface LeaveManageProps {
  user: User;
  leaves: LeaveRequest[];
  setLeaves: React.Dispatch<React.SetStateAction<LeaveRequest[]>>;
  encashments: EncashmentRequest[];
  setEncashments: React.Dispatch<React.SetStateAction<EncashmentRequest[]>>;
  onAddNotification: (notif: Omit<AppNotification, 'id' | 'time' | 'read'>) => void;
  users: User[];
}

const LeaveManage: React.FC<LeaveManageProps> = ({ user: currentAdmin, leaves, setLeaves, encashments, setEncashments, onAddNotification, users }) => {
  const [activeTab, setActiveTab] = useState<'leaves' | 'encashments'>('leaves');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isFilterVisible, setIsFilterVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Advanced Filter State
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [monthFilter, setMonthFilter] = useState<string>('All');
  const [yearFilter, setYearFilter] = useState<string>('All');
  
  const itemsPerPage = 5;

  const months = [
    { value: '01', label: 'January' },
    { value: '02', label: 'February' },
    { value: '03', label: 'March' },
    { value: '04', label: 'April' },
    { value: '05', label: 'May' },
    { value: '06', label: 'June' },
    { value: '07', label: 'July' },
    { value: '08', label: 'August' },
    { value: '09', label: 'September' },
    { value: '10', label: 'October' },
    { value: '11', label: 'November' },
    { value: '12', label: 'December' }
  ];

  const years = ['2024', '2025', '2026'];

  const filteredLeaves = useMemo(() => {
    return leaves.filter(l => {
      const matchesSearch = l.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            l.category.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'All' || l.status === statusFilter;
      const matchesCategory = categoryFilter === 'All' || l.category === categoryFilter;
      
      const appliedDate = new Date(l.appliedDate);
      const matchesMonth = monthFilter === 'All' || (appliedDate.getMonth() + 1).toString().padStart(2, '0') === monthFilter;
      const matchesYear = yearFilter === 'All' || appliedDate.getFullYear().toString() === yearFilter;

      return matchesSearch && matchesStatus && matchesCategory && matchesMonth && matchesYear;
    });
  }, [leaves, searchTerm, statusFilter, categoryFilter, monthFilter, yearFilter]);

  const filteredEncashments = useMemo(() => {
    return encashments.filter(e => {
      const matchesSearch = e.fullName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'All' || e.status === statusFilter;
      
      const appliedDate = new Date(e.appliedDate);
      const matchesMonth = monthFilter === 'All' || (appliedDate.getMonth() + 1).toString().padStart(2, '0') === monthFilter;
      const matchesYear = yearFilter === 'All' || appliedDate.getFullYear().toString() === yearFilter;

      return matchesSearch && matchesStatus && matchesMonth && matchesYear;
    });
  }, [encashments, searchTerm, statusFilter, monthFilter, yearFilter]);

  const currentData = activeTab === 'leaves' ? filteredLeaves : filteredEncashments;
  const totalPages = Math.ceil(currentData.length / itemsPerPage);
  const paginatedData = currentData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, activeTab, statusFilter, categoryFilter, monthFilter, yearFilter]);

  const handleLeaveStatus = async (id: string, status: LeaveStatus) => {
    const leave = leaves.find(l => l.id === id);
    if (leave) {
      try {
        const token = localStorage.getItem('smart_leave_token');
        const response = await fetch(`/api/leaves/${id}`, {
          method: 'PATCH',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ status }),
        });

        if (response.ok) {
          setLeaves(prev => prev.map(l => l.id === id ? { ...l, status } : l));
          
          const user = users.find(u => u.id === leave.userId);
          const userEmail = user?.email || 'employee@company.com';

          const notificationDesc = `Your ${leave.category} request has been ${status.toLowerCase()}.`;
          onAddNotification({ 
            userId: leave.userId, 
            title: `Leave ${status}`, 
            desc: `${notificationDesc} (Email sent to ${userEmail})`, 
            type: status === LeaveStatus.APPROVED ? 'success' : 'error' 
          });

          // Notify Admin (Confirmation)
          onAddNotification({
            userId: currentAdmin.id,
            title: `Request ${status}`,
            desc: `You have ${status.toLowerCase()} the ${leave.category} request for ${leave.fullName}.`,
            type: 'info'
          });
        }
      } catch (err) {
        console.error('Failed to update leave status:', err);
      }
    }
  };

  const handleEncashmentStatus = async (id: string, status: LeaveStatus) => {
    const enc = encashments.find(e => e.id === id);
    if (enc) {
      try {
        const token = localStorage.getItem('smart_leave_token');
        const response = await fetch(`/api/encashments/${id}`, {
          method: 'PATCH',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ status }),
        });

        if (response.ok) {
          setEncashments(prev => prev.map(e => e.id === id ? { ...e, status } : e));
          
          const user = users.find(u => u.id === enc.userId);
          const userEmail = user?.email || 'employee@company.com';

          const notificationDesc = `Your request to sell ${enc.daysToSell} days has been ${status.toLowerCase()}.`;
          onAddNotification({ 
            userId: enc.userId, 
            title: `Encashment ${status}`, 
            desc: `${notificationDesc} (Email sent to ${userEmail})`, 
            type: status === LeaveStatus.APPROVED ? 'success' : 'error' 
          });

          // Notify Admin (Confirmation)
          onAddNotification({
            userId: currentAdmin.id,
            title: `Encashment ${status}`,
            desc: `You have ${status.toLowerCase()} the encashment request for ${enc.fullName} (${enc.daysToSell} days).`,
            type: 'info'
          });

          // Simulating real email sending
          console.log(`[SIMULATED EMAIL] To: ${userEmail} | Subject: Encashment Request ${status} | Body: ${notificationDesc}`);
        }
      } catch (err) {
        console.error('Failed to update encashment status:', err);
      }
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const openDetails = (item: any) => {
    setSelectedItem(item);
    setIsModalOpen(true);
  };

  const closeDetails = () => {
    setSelectedItem(null);
    setIsModalOpen(false);
  };

  const resetFilters = () => {
    setStatusFilter('All');
    setCategoryFilter('All');
    setMonthFilter('All');
    setYearFilter('All');
    setSearchTerm('');
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 pb-20 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Leave Management</h1>
          <p className="text-gray-500 dark:text-gray-400">Review and process employee time-off applications</p>
        </div>
        <div className="flex items-center space-x-2 print:hidden">
          <button 
            onClick={handlePrint}
            className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold flex items-center hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 dark:shadow-none active:scale-95"
          >
            <Printer className="mr-2" size={18} />
            Print to PDF
          </button>
        </div>
      </header>

      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        {/* Main Controls Row */}
        <div className="p-6 border-b border-gray-50 dark:border-gray-700 flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-gray-50/30 dark:bg-gray-900/20 print:hidden">
          <div className="flex p-1 bg-gray-100 dark:bg-gray-900 rounded-xl w-full lg:w-auto">
            <button 
              onClick={() => setActiveTab('leaves')} 
              className={`flex-1 lg:flex-none px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'leaves' ? 'bg-white dark:bg-gray-800 text-indigo-600 shadow-sm' : 'text-gray-500'}`}
            >
              Leaves
            </button>
            <button 
              onClick={() => setActiveTab('encashments')} 
              className={`flex-1 lg:flex-none px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'encashments' ? 'bg-white dark:bg-gray-800 text-indigo-600 shadow-sm' : 'text-gray-500'}`}
            >
              Encashments
            </button>
          </div>
          
          <div className="flex flex-col md:flex-row items-center gap-3 w-full lg:w-auto">
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="text" 
                placeholder="Search requests..." 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)} 
                className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500" 
              />
            </div>
              <button 
                onClick={() => setIsFilterVisible(!isFilterVisible)}
                className={`flex items-center justify-center px-4 py-2.5 rounded-xl text-sm font-bold border transition-all w-full md:w-auto ${isFilterVisible ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50'}`}
              >
                <Filter className="mr-2" size={18} />
                Filters
                {(statusFilter !== 'All' || categoryFilter !== 'All' || monthFilter !== 'All' || yearFilter !== 'All') && (
                  <span className="ml-2 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                )}
              </button>
          </div>
        </div>

        {/* Expandable Filter Panel */}
        {isFilterVisible && (
          <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700 animate-in slide-in-from-top-4 duration-300 print:hidden">
            <div className="flex flex-wrap items-end gap-6">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-gray-400 dark:text-gray-500 tracking-widest">Status</label>
                <select 
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="block w-48 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-bold outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="All">All Statuses</option>
                  <option value={LeaveStatus.PENDING}>Pending</option>
                  <option value={LeaveStatus.APPROVED}>Approved</option>
                  <option value={LeaveStatus.REJECTED}>Rejected</option>
                </select>
              </div>

              {activeTab === 'leaves' && (
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-gray-400 dark:text-gray-500 tracking-widest">Type</label>
                  <select 
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="block w-48 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-bold outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="All">All Categories</option>
                    {Object.values(LeaveCategory).map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-gray-400 dark:text-gray-500 tracking-widest">Month</label>
                <select 
                  value={monthFilter}
                  onChange={(e) => setMonthFilter(e.target.value)}
                  className="block w-40 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-bold outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="All">All Months</option>
                  {months.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-gray-400 dark:text-gray-500 tracking-widest">Year</label>
                <select 
                  value={yearFilter}
                  onChange={(e) => setYearFilter(e.target.value)}
                  className="block w-32 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-bold outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="All">All Years</option>
                  {years.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>

              <button 
                onClick={resetFilters}
                className="mb-0.5 px-4 py-2 text-[10px] font-black uppercase text-gray-400 hover:text-red-500 transition-colors flex items-center"
              >
                <X size={14} className="mr-1" />
                Reset
              </button>
            </div>
          </div>
        )}

        {/* Print Only Header */}
        <div className="hidden print:block p-8 text-center border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Leave Management Report</h2>
          <p className="text-sm text-gray-500 mt-1">Generated on {new Date().toLocaleString()} • Departmental Record</p>
        </div>

        {/* Table View */}
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50/50 dark:bg-gray-900/30 border-b border-gray-100 dark:border-gray-700">
              <tr>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Employee</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Detail</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Applied</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest text-right print:hidden">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
              {paginatedData.map((item: any) => (
                <tr key={item.id} className="hover:bg-indigo-50/30 dark:hover:bg-indigo-900/10 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-400 flex items-center justify-center text-xs font-black print:hidden">
                        {item.fullName.charAt(0)}
                      </div>
                      <span className="text-sm font-bold text-gray-900 dark:text-white">{item.fullName}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                        {activeTab === 'leaves' ? item.category : 'Encashment'}
                      </span>
                      <span className="text-xs text-gray-400 dark:text-gray-500">
                        {activeTab === 'leaves' ? `${item.startDate} to ${item.endDate}` : `${item.daysToSell} Days`}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-xs font-medium text-gray-500 dark:text-gray-400">{item.appliedDate}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-md text-[9px] font-black uppercase border ${
                      item.status === LeaveStatus.APPROVED ? 'border-emerald-200 text-emerald-600 bg-emerald-50' : 
                      item.status === LeaveStatus.REJECTED ? 'border-red-200 text-red-600 bg-red-50' : 
                      'border-amber-200 text-amber-600 bg-amber-50'
                    }`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right print:hidden">
                    <div className="flex items-center justify-end space-x-2">
                      <button 
                        onClick={() => openDetails(item)}
                        className="p-2 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-indigo-600 hover:text-white transition-all"
                        title="View Details"
                      >
                        <Eye size={18} />
                      </button>
                      
                      {item.status === LeaveStatus.PENDING && (
                        <>
                          <button 
                            onClick={() => activeTab === 'leaves' ? handleLeaveStatus(item.id, LeaveStatus.APPROVED) : handleEncashmentStatus(item.id, LeaveStatus.APPROVED)} 
                            className="p-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-500 hover:text-white transition-all"
                            title="Approve"
                          >
                            <CheckCircle size={18} />
                          </button>
                          <button 
                            onClick={() => activeTab === 'leaves' ? handleLeaveStatus(item.id, LeaveStatus.REJECTED) : handleEncashmentStatus(item.id, LeaveStatus.REJECTED)} 
                            className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-500 hover:text-white transition-all"
                            title="Reject"
                          >
                            <XCircle size={18} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {paginatedData.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center opacity-40">
                      <FileText size={48} className="text-gray-400 mb-4" />
                      <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">No Applications Found</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 bg-gray-50/50 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between print:hidden">
            <span className="text-xs font-bold text-gray-400">Page {currentPage} of {totalPages}</span>
            <div className="flex items-center space-x-2">
              <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))} 
                disabled={currentPage === 1} 
                className="p-2 bg-white dark:bg-gray-800 rounded-lg disabled:opacity-30 border border-gray-200 shadow-sm"
              >
                <ChevronLeft size={16} />
              </button>
              <button 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} 
                disabled={currentPage === totalPages} 
                className="p-2 bg-white dark:bg-gray-800 rounded-lg disabled:opacity-30 border border-gray-200 shadow-sm"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Details Modal */}
      {isModalOpen && selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-gray-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between bg-gray-50/50 dark:bg-gray-900/50">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Request Details</h3>
              <button 
                onClick={closeDetails}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-400 flex items-center justify-center text-lg font-black">
                  {selectedItem.fullName.charAt(0)}
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 dark:text-white">{selectedItem.fullName}</h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Applied on {selectedItem.appliedDate}</p>
                </div>
                <div className="ml-auto">
                  <span className={`px-2 py-1 rounded-md text-[9px] font-black uppercase border ${
                    selectedItem.status === LeaveStatus.APPROVED ? 'border-emerald-200 text-emerald-600 bg-emerald-50' : 
                    selectedItem.status === LeaveStatus.REJECTED ? 'border-red-200 text-red-600 bg-red-50' : 
                    'border-amber-200 text-amber-600 bg-amber-50'
                  }`}>
                    {selectedItem.status}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-gray-100 dark:border-gray-700">
                  <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1">Type</p>
                  <p className="text-sm font-bold text-gray-800 dark:text-gray-200">
                    {activeTab === 'leaves' ? selectedItem.category : 'Encashment'}
                  </p>
                </div>
                <div className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-gray-100 dark:border-gray-700">
                  <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1">
                    {activeTab === 'leaves' ? 'Duration' : 'Days'}
                  </p>
                  <p className="text-sm font-bold text-gray-800 dark:text-gray-200">
                    {activeTab === 'leaves' ? `${selectedItem.startDate} to ${selectedItem.endDate}` : `${selectedItem.daysToSell} Days`}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-2">Reason / Justification</p>
                <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-gray-100 dark:border-gray-700">
                  <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed italic">
                    "{selectedItem.reason || 'No reason provided.'}"
                  </p>
                </div>
              </div>

              {selectedItem.supportingDoc && (
                <div>
                  <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-2">Attachment</p>
                  <div className="flex items-center justify-between p-3 bg-indigo-50/50 dark:bg-indigo-900/20 rounded-2xl border border-indigo-100/50 dark:border-indigo-900/50">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-white dark:bg-gray-800 rounded-lg text-indigo-600 dark:text-indigo-400 shadow-sm">
                        <Paperclip size={16} />
                      </div>
                      <span className="text-xs font-bold text-gray-700 dark:text-gray-300 truncate max-w-[200px]">
                        {selectedItem.supportingDoc.startsWith('data:') ? 'Supporting Document' : selectedItem.supportingDoc}
                      </span>
                    </div>
                    {selectedItem.supportingDoc.startsWith('data:') ? (
                      <a 
                        href={selectedItem.supportingDoc}
                        download={`document_${selectedItem.id}`}
                        className="p-2 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 rounded-lg transition-colors"
                        title="Download Document"
                      >
                        <Download size={16} />
                      </a>
                    ) : (
                      <button 
                        onClick={() => alert('This is a mock document name. Real downloads only work for newly uploaded files in this demo.')}
                        className="p-2 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 rounded-lg transition-colors"
                      >
                        <Download size={16} />
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-700 flex space-x-3">
              {selectedItem.status === LeaveStatus.PENDING ? (
                <>
                  <button 
                    onClick={() => {
                      activeTab === 'leaves' ? handleLeaveStatus(selectedItem.id, LeaveStatus.APPROVED) : handleEncashmentStatus(selectedItem.id, LeaveStatus.APPROVED);
                      closeDetails();
                    }}
                    className="flex-1 py-3 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 dark:shadow-none"
                  >
                    Approve Request
                  </button>
                  <button 
                    onClick={() => {
                      activeTab === 'leaves' ? handleLeaveStatus(selectedItem.id, LeaveStatus.REJECTED) : handleEncashmentStatus(selectedItem.id, LeaveStatus.REJECTED);
                      closeDetails();
                    }}
                    className="flex-1 py-3 bg-red-600 text-white rounded-xl text-sm font-bold hover:bg-red-700 transition-all shadow-lg shadow-red-100 dark:shadow-none"
                  >
                    Reject Request
                  </button>
                </>
              ) : (
                <button 
                  onClick={closeDetails}
                  className="w-full py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-xl text-sm font-bold hover:bg-gray-300 dark:hover:bg-gray-600 transition-all"
                >
                  Close
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeaveManage;