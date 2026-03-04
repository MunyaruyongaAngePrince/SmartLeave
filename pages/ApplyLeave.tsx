
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FileText, 
  Send, 
  Upload, 
  DollarSign, 
  Calendar as CalendarIcon,
  CheckCircle2,
  AlertCircle,
  User as UserIcon
} from 'lucide-react';
import { User, Role, LeaveRequest, LeaveStatus, LeaveCategory, EncashmentRequest, AppNotification } from '../types';
import { notificationService, handleErrorNotification } from '../services/notificationService';
import { parseApiError, logError } from '../services/errorHandler';

interface ApplyLeaveProps {
  user: User;
  leaves: LeaveRequest[];
  setLeaves: React.Dispatch<React.SetStateAction<LeaveRequest[]>>;
  encashments: EncashmentRequest[];
  setEncashments: React.Dispatch<React.SetStateAction<EncashmentRequest[]>>;
  onAddNotification: (notif: Omit<AppNotification, 'id' | 'time' | 'read'>) => void;
  users: User[];
}

const ApplyLeave: React.FC<ApplyLeaveProps> = ({ user, leaves, setLeaves, encashments, setEncashments, onAddNotification, users }) => {
  const [activeTab, setActiveTab] = useState<'application' | 'encashment'>('application');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const navigate = useNavigate();

  // Application Form State
  const [leaveForm, setLeaveForm] = useState({
    fullName: user.fullName,
    category: LeaveCategory.ANNUAL,
    startDate: '',
    endDate: '',
    reason: '',
    supportingDoc: null as File | null
  });

  // Encashment Form State
  const [encashmentForm, setEncashmentForm] = useState({
    days: 5,
    reason: '',
    supportingDoc: null as File | null
  });

  const notifyManagement = (title: string, desc: string) => {
    // Notify all HR Managers and Admins
    const managers = users.filter(u => u.role === Role.ADMIN || u.role === Role.HR_MANAGER);
    managers.forEach(mgr => {
      onAddNotification({
        userId: mgr.id,
        title,
        desc,
        type: 'info'
      });
    });

    // Also notify the user themselves as confirmation
    onAddNotification({
      userId: user.id,
      title: 'Request Submitted',
      desc: `Your application has been successfully sent to HR. (Confirmation sent to ${user.email})`,
      type: 'success'
    });
  };

  const handleLeaveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!leaveForm.startDate || !leaveForm.endDate) {
      notificationService.error('Please select both start and end dates.');
      return;
    }

    const startDate = new Date(leaveForm.startDate);
    const endDate = new Date(leaveForm.endDate);

    if (startDate > endDate) {
      notificationService.error('Start date cannot be after end date.');
      return;
    }

    if (!leaveForm.reason.trim()) {
      notificationService.error('Please provide a reason for your leave request.');
      return;
    }

    setIsSubmitting(true);
    
    const processSubmit = async (docData?: string) => {
      const newRequest = {
        id: Math.random().toString(36).substr(2, 9),
        userId: user.id,
        fullName: leaveForm.fullName,
        category: leaveForm.category,
        startDate: leaveForm.startDate,
        endDate: leaveForm.endDate,
        reason: leaveForm.reason,
        status: LeaveStatus.PENDING,
        appliedDate: new Date().toISOString().split('T')[0],
        supportingDoc: docData
      };
      
      try {
        const token = localStorage.getItem('smart_leave_token');
        const response = await fetch('/api/leaves', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(newRequest),
        });

        const data = await response.json();

        if (response.ok && data.success) {
          setLeaves(prev => [newRequest as LeaveRequest, ...prev]);
          
          // Notify management
          const managers = users.filter(u => u.role === Role.ADMIN || u.role === Role.HR_MANAGER);
          managers.forEach(mgr => {
            onAddNotification({
              userId: mgr.id,
              title: 'New Leave Request',
              desc: `${user.fullName} applied for ${leaveForm.category} from ${leaveForm.startDate} to ${leaveForm.endDate}.`,
              type: 'info'
            });
          });

          // Notify user
          onAddNotification({
            userId: user.id,
            title: 'Leave Request Submitted',
            desc: `Your ${leaveForm.category} request has been submitted successfully and is pending HR approval.`,
            type: 'success'
          });

          notificationService.success('Leave request submitted successfully! You will be notified once it is reviewed.');
          
          setShowSuccess(true);
          setTimeout(() => {
            setShowSuccess(false);
            setLeaveForm({
              fullName: user.fullName,
              category: LeaveCategory.ANNUAL,
              startDate: '',
              endDate: '',
              reason: '',
              supportingDoc: null
            });
            navigate('/history');
          }, 2000);
        } else {
          const errorMsg = data.message || 'Failed to submit leave request. Please try again.';
          notificationService.error(errorMsg);
          logError({ message: errorMsg, code: 'LEAVE_SUBMIT_FAILED', statusCode: 400 }, 'Submit leave');
        }
      } catch (err) {
        const errorDetails = parseApiError(err);
        notificationService.error(errorDetails.message);
        logError(errorDetails, 'Submit leave request');
      } finally {
        setIsSubmitting(false);
      }
    };

    if (leaveForm.supportingDoc) {
      const reader = new FileReader();
      reader.onloadend = () => {
        processSubmit(reader.result as string);
      };
      reader.onerror = () => {
        notificationService.error('Failed to read the file. Please try again.');
        setIsSubmitting(false);
      };
      reader.readAsDataURL(leaveForm.supportingDoc);
    } else {
      processSubmit();
    }
  };

  const handleEncashmentSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!encashmentForm.days || encashmentForm.days <= 0) {
      notificationService.error('Please enter a valid number of days to encash (must be greater than 0).');
      return;
    }

    if (encashmentForm.days > 365) {
      notificationService.error('Cannot encash more than 365 days at once.');
      return;
    }

    if (!encashmentForm.reason.trim()) {
      notificationService.error('Please provide a reason for the encashment request.');
      return;
    }

    setIsSubmitting(true);
    
    const processSubmit = async (docData?: string) => {
      const newRequest: EncashmentRequest = {
        id: Math.random().toString(36).substr(2, 9),
        userId: user.id,
        fullName: user.fullName,
        daysToSell: encashmentForm.days,
        reason: encashmentForm.reason,
        status: LeaveStatus.PENDING,
        appliedDate: new Date().toISOString().split('T')[0],
        supportingDoc: docData
      };
      
      try {
        const token = localStorage.getItem('smart_leave_token');
        const response = await fetch('/api/encashments', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(newRequest),
        });

        const data = await response.json();

        if (response.ok && data.success) {
          setEncashments(prev => [newRequest, ...prev]);

          // Notify management
          const managers = users.filter(u => u.role === Role.ADMIN || u.role === Role.HR_MANAGER);
          managers.forEach(mgr => {
            onAddNotification({
              userId: mgr.id,
              title: 'New Encashment Request',
              desc: `${user.fullName} requested to encash ${encashmentForm.days} leave days.`,
              type: 'info'
            });
          });

          // Notify user
          onAddNotification({
            userId: user.id,
            title: 'Encashment Request Submitted',
            desc: `Your request to encash ${encashmentForm.days} days has been submitted and is pending approval.`,
            type: 'success'
          });

          notificationService.success('Encashment request submitted successfully! You will be notified once it is reviewed.');

          setShowSuccess(true);
          setTimeout(() => {
            setShowSuccess(false);
            setEncashmentForm({
              days: 5,
              reason: '',
              supportingDoc: null
            });
            navigate('/dashboard');
          }, 2000);
        } else {
          const errorMsg = data.message || 'Failed to submit encashment request. Please try again.';
          notificationService.error(errorMsg);
          logError({ message: errorMsg, code: 'ENCASHMENT_SUBMIT_FAILED', statusCode: 400 }, 'Submit encashment');
        }
      } catch (err) {
        const errorDetails = parseApiError(err);
        notificationService.error(errorDetails.message);
        logError(errorDetails, 'Submit encashment request');
      } finally {
        setIsSubmitting(false);
      }
    };

    if (encashmentForm.supportingDoc) {
      const reader = new FileReader();
      reader.onloadend = () => {
        processSubmit(reader.result as string);
      };
      reader.onerror = () => {
        notificationService.error('Failed to read the file. Please try again.');
        setIsSubmitting(false);
      };
      reader.readAsDataURL(encashmentForm.supportingDoc);
    } else {
      processSubmit();
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto pb-20">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Leave Management Actions</h1>
        <p className="text-gray-500 dark:text-gray-400">Submit a new request or sell remaining leave days</p>
      </header>

      {/* Tabs */}
      <div className="flex p-1 bg-gray-100 dark:bg-gray-800 rounded-2xl mb-8">
        <button
          onClick={() => setActiveTab('application')}
          className={`flex-1 flex items-center justify-center py-3 text-sm font-bold rounded-xl transition-all ${
            activeTab === 'application' ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          <FileText className="mr-2" size={18} />
          Leave Application
        </button>
        <button
          onClick={() => setActiveTab('encashment')}
          className={`flex-1 flex items-center justify-center py-3 text-sm font-bold rounded-xl transition-all ${
            activeTab === 'encashment' ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          <DollarSign className="mr-2" size={18} />
          Sell Leave (Encashment)
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl shadow-gray-100 dark:shadow-none border border-gray-100 dark:border-gray-700 overflow-hidden relative">
        {showSuccess && (
          <div className="absolute inset-0 z-10 bg-white dark:bg-gray-800 bg-opacity-95 dark:bg-opacity-95 flex flex-col items-center justify-center transition-all animate-in fade-in">
            <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 size={32} />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Request Submitted!</h3>
            <p className="text-gray-500 dark:text-gray-400 mt-2">Your application is being processed by HR.</p>
          </div>
        )}

        {activeTab === 'application' ? (
          <form onSubmit={handleLeaveSubmit} className="p-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Full Name</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                    <UserIcon size={18} />
                  </span>
                  <input
                    type="text"
                    readOnly
                    value={leaveForm.fullName}
                    className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl pl-10 pr-4 py-3 outline-none cursor-not-allowed text-gray-600 dark:text-gray-400"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Leave Category</label>
                <select
                  required
                  value={leaveForm.category}
                  onChange={(e) => setLeaveForm({...leaveForm, category: e.target.value as LeaveCategory})}
                  className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-gray-900 dark:text-white"
                >
                  {Object.values(LeaveCategory).map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Start Date</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400 pointer-events-none">
                    <CalendarIcon size={18} />
                  </span>
                  <input
                    type="date"
                    required
                    value={leaveForm.startDate}
                    onChange={(e) => setLeaveForm({...leaveForm, startDate: e.target.value})}
                    className="w-full bg-white dark:bg-gray-900 pl-10 pr-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-gray-900 dark:text-white"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">End Date</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400 pointer-events-none">
                    <CalendarIcon size={18} />
                  </span>
                  <input
                    type="date"
                    required
                    value={leaveForm.endDate}
                    onChange={(e) => setLeaveForm({...leaveForm, endDate: e.target.value})}
                    className="w-full bg-white dark:bg-gray-900 pl-10 pr-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-gray-900 dark:text-white"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Reason for Leave</label>
              <textarea
                required
                rows={4}
                value={leaveForm.reason}
                onChange={(e) => setLeaveForm({...leaveForm, reason: e.target.value})}
                placeholder="Briefly explain the purpose of your leave..."
                className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500 transition-all resize-none text-gray-900 dark:text-white"
              ></textarea>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Supporting Documents (Optional)</label>
              <div className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl p-6 flex flex-col items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer relative">
                <input
                  type="file"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  onChange={(e) => setLeaveForm({...leaveForm, supportingDoc: e.target.files?.[0] || null})}
                />
                <Upload className="text-gray-400 dark:text-gray-500 mb-2" size={24} />
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                  {leaveForm.supportingDoc ? leaveForm.supportingDoc.name : 'Click to upload or drag & drop'}
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">PDF, JPG, PNG up to 5MB</p>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-indigo-600 text-white font-bold py-4 rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-100 dark:shadow-none flex items-center justify-center transition-all transform active:scale-[0.98]"
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <Send className="mr-2" size={18} />
                  Submit Application
                </>
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleEncashmentSubmit} className="p-8 space-y-6">
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-900/50 rounded-2xl p-4 flex items-start mb-2">
              <AlertCircle className="text-amber-500 dark:text-amber-400 mr-3 mt-0.5 flex-shrink-0" size={18} />
              <div>
                <h4 className="text-sm font-bold text-amber-800 dark:text-amber-300">Policy Reminder</h4>
                <p className="text-xs text-amber-700 dark:text-amber-400 mt-1 leading-relaxed">
                  You can sell a maximum of 31 leave days per calendar year. Encashment is subject to departmental approval and current budget availability.
                </p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Full Name</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                  <UserIcon size={18} />
                </span>
                <input
                  type="text"
                  readOnly
                  value={user.fullName}
                  className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl pl-10 pr-4 py-3 outline-none cursor-not-allowed text-gray-500 dark:text-gray-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-4">Number of Days to Encash</label>
              <div className="flex items-center space-x-4">
                <button 
                  type="button" 
                  onClick={() => setEncashmentForm(f => ({...f, days: Math.max(1, f.days - 1)}))}
                  className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-600"
                >-</button>
                <div className="flex-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl py-3 text-center text-2xl font-bold text-gray-900 dark:text-white">
                  {encashmentForm.days}
                </div>
                <button 
                  type="button" 
                  onClick={() => setEncashmentForm(f => ({...f, days: Math.min(31, f.days + 1)}))}
                  className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-600"
                >+</button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Justification</label>
              <textarea
                required
                rows={4}
                value={encashmentForm.reason}
                onChange={(e) => setEncashmentForm({...encashmentForm, reason: e.target.value})}
                placeholder="Provide a brief reason for your encashment request..."
                className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500 transition-all resize-none text-gray-900 dark:text-white"
              ></textarea>
            </div>

            <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl flex items-center justify-between border border-indigo-100 dark:border-indigo-900/50">
              <div>
                <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">Estimated Payout</p>
                <p className="text-2xl font-bold text-indigo-900 dark:text-indigo-100 mt-1">RWF {(encashmentForm.days * 2500).toLocaleString()}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-indigo-400">2,500 FRW per day</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Supporting Documents (Optional)</label>
              <div className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl p-6 flex flex-col items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer relative">
                <input
                  type="file"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  onChange={(e) => setEncashmentForm({...encashmentForm, supportingDoc: e.target.files?.[0] || null})}
                />
                <Upload className="text-gray-400 dark:text-gray-500 mb-2" size={24} />
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                  {encashmentForm.supportingDoc ? encashmentForm.supportingDoc.name : 'Click to upload or drag & drop'}
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">PDF, JPG, PNG up to 5MB</p>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-indigo-600 text-white font-bold py-4 rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-100 dark:shadow-none flex items-center justify-center transition-all transform active:scale-[0.98]"
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <DollarSign className="mr-2" size={18} />
                  Confirm Encashment Request
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ApplyLeave;
