
import React, { useState, useMemo, useEffect } from 'react';
import { 
  Search, 
  Printer, 
  ChevronLeft, 
  ChevronRight, 
  Download, 
  Calendar, 
  FileText, 
  DollarSign,
  AlertCircle,
  Eye,
  Paperclip,
  X,
  Filter
} from 'lucide-react';
import { User, LeaveRequest, LeaveStatus, EncashmentRequest, LeaveCategory } from '../types';

interface LeaveHistoryProps {
  user: User;
  leaves: LeaveRequest[];
  encashments: EncashmentRequest[];
}

const LeaveHistory: React.FC<LeaveHistoryProps> = ({ user, leaves, encashments }) => {
  const [activeTab, setActiveTab] = useState<'leaves' | 'encashments'>('leaves');
  const [searchTerm, setSearchTerm] = useState('');
  const [isFilterVisible, setIsFilterVisible] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [monthFilter, setMonthFilter] = useState<string>('All');
  const [yearFilter, setYearFilter] = useState<string>('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const itemsPerPage = 5;

  const userLeaves = leaves.filter(l => l.userId === user.id);
  const userEncashments = encashments.filter(e => e.userId === user.id);

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

  const filteredData = useMemo(() => {
    if (activeTab === 'leaves') {
      return userLeaves.filter(leave => {
        const matchesSearch = 
          leave.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
          leave.reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
          leave.status.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesStatus = statusFilter === 'All' || leave.status === statusFilter;
        const matchesCategory = categoryFilter === 'All' || leave.category === categoryFilter;
        
        const appliedDate = new Date(leave.appliedDate);
        const matchesMonth = monthFilter === 'All' || (appliedDate.getMonth() + 1).toString().padStart(2, '0') === monthFilter;
        const matchesYear = yearFilter === 'All' || appliedDate.getFullYear().toString() === yearFilter;
        
        return matchesSearch && matchesStatus && matchesCategory && matchesMonth && matchesYear;
      });
    } else {
      return userEncashments.filter(enc => {
        const matchesSearch = 
          enc.reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
          enc.status.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesStatus = statusFilter === 'All' || enc.status === statusFilter;
        
        const appliedDate = new Date(enc.appliedDate);
        const matchesMonth = monthFilter === 'All' || (appliedDate.getMonth() + 1).toString().padStart(2, '0') === monthFilter;
        const matchesYear = yearFilter === 'All' || appliedDate.getFullYear().toString() === yearFilter;
        
        return matchesSearch && matchesStatus && matchesMonth && matchesYear;
      });
    }
  }, [userLeaves, userEncashments, searchTerm, statusFilter, categoryFilter, monthFilter, yearFilter, activeTab]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, activeTab, statusFilter, categoryFilter, monthFilter, yearFilter]);

  const calculateDuration = (start: string, end: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return isNaN(diffDays) ? 0 : diffDays;
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

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto pb-20 animate-in fade-in duration-300">
      <header className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Request History</h1>
          <p className="text-gray-500 dark:text-gray-400">Track all your leave applications and encashment requests</p>
        </div>
        <div className="flex items-center space-x-3 no-print">
          <button 
            onClick={handlePrint}
            className="px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-bold text-gray-700 dark:text-gray-200 flex items-center hover:bg-gray-50 dark:hover:bg-gray-700 transition-all shadow-sm"
          >
            <Printer className="mr-2 text-indigo-500 dark:text-indigo-400" size={18} />
            Print Report
          </button>
        </div>
      </header>

      {/* Tabs */}
      <div className="flex p-1 bg-gray-100 dark:bg-gray-800 rounded-2xl mb-8 w-full md:w-fit no-print">
        <button
          onClick={() => { setActiveTab('leaves'); setCurrentPage(1); }}
          className={`flex items-center px-6 py-2.5 text-sm font-bold rounded-xl transition-all ${
            activeTab === 'leaves' ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          <FileText className="mr-2" size={16} />
          Leave Applications
        </button>
        <button
          onClick={() => { setActiveTab('encashments'); setCurrentPage(1); }}
          className={`flex items-center px-6 py-2.5 text-sm font-bold rounded-xl transition-all ${
            activeTab === 'encashments' ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          <DollarSign className="mr-2" size={16} />
          Encashment History
        </button>
      </div>

      {/* Filters & Search */}
      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 mb-6 overflow-hidden no-print">
        <div className="p-4 flex flex-col md:flex-row items-center gap-4 bg-gray-50/30 dark:bg-gray-900/20">
          <div className="relative flex-1 w-full">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
              <Search size={18} />
            </span>
            <input
              type="text"
              placeholder={`Search ${activeTab === 'leaves' ? 'applications' : 'encashments'}...`}
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm dark:text-white"
            />
          </div>
          
          <button 
            onClick={() => setIsFilterVisible(!isFilterVisible)}
            className={`flex items-center justify-center px-6 py-2.5 rounded-2xl text-sm font-bold border transition-all w-full md:w-auto ${
              isFilterVisible 
                ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg' 
                : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50'
            }`}
          >
            <Filter className="mr-2" size={18} />
            Filters
            {(statusFilter !== 'All' || categoryFilter !== 'All' || monthFilter !== 'All' || yearFilter !== 'All') && (
              <span className="ml-2 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
            )}
          </button>
        </div>

        {/* Expandable Filter Panel */}
        {isFilterVisible && (
          <div className="px-6 py-6 bg-white dark:bg-gray-800 border-t border-gray-50 dark:border-gray-700 animate-in slide-in-from-top-4 duration-300">
            <div className="flex flex-wrap items-end gap-6">
              {activeTab === 'leaves' && (
                <div className="space-y-1.5 flex-1 min-w-[180px]">
                  <label className="text-[10px] font-black uppercase text-gray-400 dark:text-gray-500 tracking-widest ml-1">Category</label>
                  <select
                    value={categoryFilter}
                    onChange={(e) => { setCategoryFilter(e.target.value); setCurrentPage(1); }}
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-xs dark:text-white font-bold"
                  >
                    <option value="All">All Categories</option>
                    {Object.values(LeaveCategory).map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              )}
              
              <div className="space-y-1.5 flex-1 min-w-[180px]">
                <label className="text-[10px] font-black uppercase text-gray-400 dark:text-gray-500 tracking-widest ml-1">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-xs dark:text-white font-bold"
                >
                  <option value="All">All Statuses</option>
                  {Object.values(LeaveStatus).map(status => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5 flex-1 min-w-[150px]">
                <label className="text-[10px] font-black uppercase text-gray-400 dark:text-gray-500 tracking-widest ml-1">Month</label>
                <select
                  value={monthFilter}
                  onChange={(e) => { setMonthFilter(e.target.value); setCurrentPage(1); }}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-xs dark:text-white font-bold"
                >
                  <option value="All">All Months</option>
                  {months.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                </select>
              </div>

              <div className="space-y-1.5 flex-1 min-w-[120px]">
                <label className="text-[10px] font-black uppercase text-gray-400 dark:text-gray-500 tracking-widest ml-1">Year</label>
                <select
                  value={yearFilter}
                  onChange={(e) => { setYearFilter(e.target.value); setCurrentPage(1); }}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-xs dark:text-white font-bold"
                >
                  <option value="All">All Years</option>
                  {years.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
              
              <button
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('All');
                  setCategoryFilter('All');
                  setMonthFilter('All');
                  setYearFilter('All');
                  setCurrentPage(1);
                }}
                className="px-4 py-2.5 text-gray-400 hover:text-red-500 transition-colors flex items-center gap-1 text-[10px] font-black uppercase tracking-widest"
                title="Clear Filters"
              >
                <X size={16} />
                Reset
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Table Section */}
      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            {activeTab === 'leaves' ? (
              <>
                <thead className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700">
                  <tr>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Applied Date</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Leave Category</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Period</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-center">Duration</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right no-print">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                  {paginatedData.map((leave: any) => (
                    <tr key={leave.id} className="hover:bg-indigo-50 dark:hover:bg-indigo-900/10 transition-colors group">
                      <td className="px-6 py-4">
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">{leave.appliedDate}</span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-bold text-gray-900 dark:text-white">{leave.category}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 italic truncate max-w-xs">"{leave.reason}"</p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center text-xs text-gray-600 dark:text-gray-400 font-medium">
                          <Calendar size={14} className="mr-1.5 text-indigo-400 dark:text-indigo-500" />
                          {leave.startDate} → {leave.endDate}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-sm font-bold text-gray-700 dark:text-gray-300">
                          {calculateDuration(leave.startDate, leave.endDate)} Days
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wide inline-flex items-center ${
                          leave.status === LeaveStatus.APPROVED ? 'bg-emerald-100 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400' :
                          leave.status === LeaveStatus.REJECTED ? 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400' :
                          'bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400'
                        }`}>
                          <div className={`w-1.5 h-1.5 rounded-full mr-2 ${
                            leave.status === LeaveStatus.APPROVED ? 'bg-emerald-500' :
                            leave.status === LeaveStatus.REJECTED ? 'bg-red-500' :
                            'bg-amber-500'
                          }`}></div>
                          {leave.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right no-print">
                        <button 
                          onClick={() => openDetails(leave)}
                          className="p-2 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-indigo-600 hover:text-white transition-all"
                          title="View Details"
                        >
                          <Eye size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </>
            ) : (
              <>
                <thead className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700">
                  <tr>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Applied Date</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Request Details</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-center">Days Sold</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Est. Payout</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right no-print">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                  {paginatedData.map((enc: any) => (
                    <tr key={enc.id} className="hover:bg-indigo-50 dark:hover:bg-indigo-900/10 transition-colors group">
                      <td className="px-6 py-4">
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">{enc.appliedDate}</span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-bold text-gray-900 dark:text-white">Leave Encashment</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 italic truncate max-w-xs">"{enc.reason}"</p>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-3 py-1 rounded-lg">
                          {enc.daysToSell} Days
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-bold text-gray-900 dark:text-white">
                          RWF {(enc.daysToSell * 25000).toLocaleString()}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wide inline-flex items-center ${
                          enc.status === LeaveStatus.APPROVED ? 'bg-emerald-100 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400' :
                          enc.status === LeaveStatus.REJECTED ? 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400' :
                          'bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400'
                        }`}>
                          <div className={`w-1.5 h-1.5 rounded-full mr-2 ${
                            enc.status === LeaveStatus.APPROVED ? 'bg-emerald-500' :
                            enc.status === LeaveStatus.REJECTED ? 'bg-red-500' :
                            'bg-amber-500'
                          }`}></div>
                          {enc.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right no-print">
                        <button 
                          onClick={() => openDetails(enc)}
                          className="p-2 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-indigo-600 hover:text-white transition-all"
                          title="View Details"
                        >
                          <Eye size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </>
            )}
            {paginatedData.length === 0 && (
              <tbody>
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center">
                      <div className="w-16 h-16 bg-gray-50 dark:bg-gray-700 rounded-full flex items-center justify-center text-gray-300 dark:text-gray-600 mb-4">
                        <AlertCircle size={32} />
                      </div>
                      <p className="text-gray-500 dark:text-gray-400 font-medium">No {activeTab === 'leaves' ? 'leave' : 'encashment'} records found.</p>
                      <p className="text-gray-400 dark:text-gray-500 text-xs mt-1 italic">Try adjusting your search or switching tabs.</p>
                    </div>
                  </td>
                </tr>
              </tbody>
            )}
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 bg-white dark:bg-gray-800 border-t border-gray-50 dark:border-gray-700 flex items-center justify-between no-print">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
              Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredData.length)} of {filteredData.length} entries
            </span>
            <div className="flex items-center space-x-2">
              <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 disabled:opacity-50 transition-colors"
              >
                <ChevronLeft size={16} />
              </button>
              <div className="flex space-x-1">
                {Array.from({ length: totalPages }, (_, i) => (
                  <button 
                    key={i}
                    onClick={() => setCurrentPage(i + 1)}
                    className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                      currentPage === i + 1 ? 'bg-indigo-600 text-white shadow-md' : 'bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-600'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
              <button 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 disabled:opacity-50 transition-colors"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Details Modal */}
      {isModalOpen && selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200 no-print">
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
                  {user.fullName.charAt(0)}
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 dark:text-white">{user.fullName}</h4>
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

            <div className="p-6 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-700">
              <button 
                onClick={closeDetails}
                className="w-full py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-xl text-sm font-bold hover:bg-gray-300 dark:hover:bg-gray-600 transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Print Footer */}
      <div className="hidden print:block mt-12 pt-8 border-t border-gray-200 text-center">
        <p className="text-xs text-gray-400 italic">This report was generated by {user.fullName} on {new Date().toLocaleString()}</p>
        <p className="text-[10px] text-gray-300 uppercase tracking-widest mt-2">SmartLeave - Organizational Transparency Report</p>
      </div>
    </div>
  );
};

export default LeaveHistory;
