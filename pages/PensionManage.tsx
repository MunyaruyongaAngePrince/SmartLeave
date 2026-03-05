import React, { useState } from 'react';
import { User, PensionRequest, LeaveStatus, Role, AppNotification } from '../types';
import { CheckCircle, XCircle, Clock, FileText, User as UserIcon, Calendar, Phone, Mail, Building2 } from 'lucide-react';

interface PensionManageProps {
  user: User;
  pensions: PensionRequest[];
  setPensions: React.Dispatch<React.SetStateAction<PensionRequest[]>>;
  onAddNotification: (notif: Omit<AppNotification, 'id' | 'time' | 'read'>) => void;
  users: User[];
}

const PensionManage: React.FC<PensionManageProps> = ({ user, pensions, setPensions, onAddNotification, users }) => {
  const [filter, setFilter] = useState<LeaveStatus | 'All'>('All');
  const [selectedPension, setSelectedPension] = useState<PensionRequest | null>(null);

  const filteredPensions = filter === 'All' ? pensions : pensions.filter(p => p.status === filter);

  const handleAction = async (pensionId: string, action: 'Approved' | 'Rejected') => {
    const pension = pensions.find(p => p.id === pensionId);
    if (!pension) return;

    try {
      const token = localStorage.getItem('smart_leave_token');
      const response = await fetch(`/api/pensions/${pensionId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: action }),
      });

      if (response.ok) {
        setPensions(prev => prev.map(p => p.id === pensionId ? { ...p, status: action as LeaveStatus } : p));

        onAddNotification({
          userId: pension.userId,
          title: `Pension Request ${action}`,
          desc: `Your ${pension.retirementCategory} request has been ${action.toLowerCase()} by HR.`,
          type: action === 'Approved' ? 'success' : 'error'
        });

        setSelectedPension(null);
      }
    } catch (err) {
      console.error('Failed to update pension:', err);
    }
  };

  const calculateAge = (dob: string) => {
    const today = new Date();
    const birthDate = new Date(dob);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 pb-20">
      <header>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
          <FileText className="mr-3 text-indigo-600 dark:text-indigo-400" size={24} />
          Pension Request Management
        </h1>
        <p className="text-gray-500 dark:text-gray-400">Review and process employee pension requests</p>
      </header>

      <div className="flex gap-3 mb-6">
        {['All', LeaveStatus.PENDING, LeaveStatus.APPROVED, LeaveStatus.REJECTED].map(status => (
          <button
            key={status}
            onClick={() => setFilter(status as LeaveStatus | 'All')}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
              filter === status
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            {status} ({status === 'All' ? pensions.length : pensions.filter(p => p.status === status).length})
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6">
        {filteredPensions.length > 0 ? (
          filteredPensions.map(pension => (
            <div key={pension.id} className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl flex items-center justify-center font-bold text-lg">
                    {pension.fullName.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">{pension.fullName}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{pension.retirementCategory}</p>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                  pension.status === LeaveStatus.APPROVED ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' :
                  pension.status === LeaveStatus.REJECTED ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' :
                  'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                }`}>
                  {pension.status}
                </span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="flex items-center text-sm">
                  <Building2 size={16} className="text-gray-400 mr-2" />
                  <span className="text-gray-600 dark:text-gray-400">{pension.department}</span>
                </div>
                <div className="flex items-center text-sm">
                  <Mail size={16} className="text-gray-400 mr-2" />
                  <span className="text-gray-600 dark:text-gray-400">{pension.email}</span>
                </div>
                <div className="flex items-center text-sm">
                  <Phone size={16} className="text-gray-400 mr-2" />
                  <span className="text-gray-600 dark:text-gray-400">{pension.phoneNumber || 'N/A'}</span>
                </div>
                <div className="flex items-center text-sm">
                  <Calendar size={16} className="text-gray-400 mr-2" />
                  <span className="text-gray-600 dark:text-gray-400">Age: {calculateAge(pension.dateOfBirth)}</span>
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-4 mb-4">
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Reason:</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">{pension.reason}</p>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">Applied: {pension.appliedDate}</span>
                {pension.status === LeaveStatus.PENDING && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAction(pension.id, 'Approved')}
                      className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 transition-all flex items-center"
                    >
                      <CheckCircle size={16} className="mr-1" />
                      Approve
                    </button>
                    <button
                      onClick={() => handleAction(pension.id, 'Rejected')}
                      className="px-4 py-2 bg-red-600 text-white rounded-xl text-sm font-bold hover:bg-red-700 transition-all flex items-center"
                    >
                      <XCircle size={16} className="mr-1" />
                      Reject
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-12 text-center">
            <Clock size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">No pension requests found</h3>
            <p className="text-gray-500 dark:text-gray-400 mt-2">There are no {filter.toLowerCase()} pension requests at the moment.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PensionManage;
