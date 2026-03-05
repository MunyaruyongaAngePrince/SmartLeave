import React, { useState } from 'react';
import { User, PensionRequest, LeaveStatus } from '../types';
import { Clock, CheckCircle, XCircle, Calendar, User as UserIcon, Mail, Phone, Building2 } from 'lucide-react';

interface PensionHistoryProps {
  user: User;
  pensions: PensionRequest[];
}

const PensionHistory: React.FC<PensionHistoryProps> = ({ user, pensions }) => {
  const userPensions = pensions.filter(p => p.userId === user.id);

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
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-8 pb-20">
      <header>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Pension Requests</h1>
        <p className="text-gray-500 dark:text-gray-400">Track the status of your pension applications</p>
      </header>

      <div className="space-y-6">
        {userPensions.length > 0 ? (
          userPensions.map(pension => (
            <div key={pension.id} className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">{pension.retirementCategory}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Applied on {pension.appliedDate}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase flex items-center gap-1 ${
                  pension.status === LeaveStatus.APPROVED ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' :
                  pension.status === LeaveStatus.REJECTED ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' :
                  'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                }`}>
                  {pension.status === LeaveStatus.APPROVED && <CheckCircle size={14} />}
                  {pension.status === LeaveStatus.REJECTED && <XCircle size={14} />}
                  {pension.status === LeaveStatus.PENDING && <Clock size={14} />}
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

              <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-4">
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Reason:</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">{pension.reason}</p>
              </div>

              {pension.status === LeaveStatus.PENDING && (
                <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-100 dark:border-yellow-900/50 rounded-xl">
                  <p className="text-xs text-yellow-700 dark:text-yellow-400">
                    Your pension request is under review by HR. You will be notified once a decision is made.
                  </p>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-12 text-center">
            <Clock size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">No Pension Requests</h3>
            <p className="text-gray-500 dark:text-gray-400 mt-2">You haven't submitted any pension requests yet.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PensionHistory;
