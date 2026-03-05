import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  Send,
  Upload,
  Calendar as CalendarIcon,
  CheckCircle2,
  User as UserIcon,
  Mail,
  Phone,
  Building2,
  Info
} from 'lucide-react';
import { User, Role, PensionRequest, LeaveStatus, RetirementCategory, AppNotification } from '../types';
import { notificationService, handleErrorNotification } from '../services/notificationService';
import { parseApiError, logError } from '../services/errorHandler';

interface PensionRequestProps {
  user: User;
  pensions: PensionRequest[];
  setPensions: React.Dispatch<React.SetStateAction<PensionRequest[]>>;
  onAddNotification: (notif: Omit<AppNotification, 'id' | 'time' | 'read'>) => void;
  users: User[];
}

const PensionRequestPage: React.FC<PensionRequestProps> = ({ user, pensions, setPensions, onAddNotification, users }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const navigate = useNavigate();

  // Check if user already has a pension request
  const userPension = pensions.find(p => p.userId === user.id);
  const hasPensionRequest = !!userPension;

  // Form State
  const [pensionForm, setPensionForm] = useState({
    fullName: user.fullName,
    email: user.email || '',
    department: user.department || '',
    phoneNumber: user.phoneNumber || '',
    dateOfBirth: '',
    retirementCategory: RetirementCategory.NORMAL,
    reason: '',
    supportingDoc: null as File | null
  });

  // Calculate age from date of birth
  const calculateAge = (dob: string) => {
    if (!dob) return null;
    const today = new Date();
    const birthDate = new Date(dob);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age >= 0 ? age : null;
  };

  // If user has a pension request, show status instead of form
  if (hasPensionRequest) {
    return (
      <div className="p-4 md:p-8 max-w-4xl mx-auto pb-20">
        <header className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Pension Request Status</h1>
          <p className="text-gray-500 dark:text-gray-400">Your pension application details and current status</p>
        </header>

        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl shadow-gray-100 dark:shadow-none border border-gray-100 dark:border-gray-700 p-8">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">{userPension.retirementCategory}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Applied on {userPension.appliedDate}</p>
            </div>
            <span className={`px-4 py-2 rounded-full text-sm font-bold uppercase flex items-center gap-2 ${
              userPension.status === LeaveStatus.APPROVED ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' :
              userPension.status === LeaveStatus.REJECTED ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' :
              'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
            }`}>
              {userPension.status === LeaveStatus.APPROVED && <CheckCircle2 size={18} />}
              {userPension.status === LeaveStatus.REJECTED && <Info size={18} />}
              {userPension.status === LeaveStatus.PENDING && <Info size={18} />}
              {userPension.status}
            </span>
          </div>

          <div className="space-y-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">Full Name</label>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">{userPension.fullName}</p>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">Email</label>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">{userPension.email}</p>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">Department</label>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">{userPension.department}</p>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">Age</label>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">{calculateAge(userPension.dateOfBirth)} years</p>
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-4">
              <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-2">Reason</label>
              <p className="text-sm text-gray-700 dark:text-gray-300">{userPension.reason}</p>
            </div>
          </div>

          {userPension.status === LeaveStatus.PENDING && (
            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-100 dark:border-yellow-900/50 rounded-xl">
              <p className="text-sm text-yellow-700 dark:text-yellow-400 flex items-center">
                <Info size={16} className="mr-2" />
                Your pension request is under review by HR. You will receive an email notification once a decision is made.
              </p>
            </div>
          )}

          {userPension.status === LeaveStatus.APPROVED && (
            <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-900/50 rounded-xl">
              <p className="text-sm text-emerald-700 dark:text-emerald-400 flex items-center">
                <CheckCircle2 size={16} className="mr-2" />
                Congratulations! Your pension request has been approved. HR will contact you with further details.
              </p>
            </div>
          )}

          {userPension.status === LeaveStatus.REJECTED && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/50 rounded-xl">
              <p className="text-sm text-red-700 dark:text-red-400 flex items-center">
                <Info size={16} className="mr-2" />
                Your pension request has been rejected. Please contact HR for more information.
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  const age = calculateAge(pensionForm.dateOfBirth);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!pensionForm.dateOfBirth) {
      notificationService.error('Please select your date of birth.');
      return;
    }

    if (age === null || age < 18) {
      notificationService.error('You must be at least 18 years old to submit a pension request.');
      return;
    }

    if (!pensionForm.reason.trim()) {
      notificationService.error('Please provide a reason for your pension request.');
      return;
    }

    setIsSubmitting(true);

    const processSubmit = async (docData?: string) => {
      const newRequest = {
        id: Math.random().toString(36).substr(2, 9),
        userId: user.id,
        fullName: pensionForm.fullName,
        email: pensionForm.email,
        department: pensionForm.department,
        phoneNumber: pensionForm.phoneNumber,
        dateOfBirth: pensionForm.dateOfBirth,
        retirementCategory: pensionForm.retirementCategory,
        reason: pensionForm.reason,
        status: LeaveStatus.PENDING,
        appliedDate: new Date().toISOString().split('T')[0],
        ...(docData && { supportingDoc: docData })
      };

      try {
        const token = localStorage.getItem('smart_leave_token');
        const response = await fetch('/api/pensions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(newRequest),
        });

        const data = await response.json();

        if (response.ok && data.success) {
          setPensions(prev => [newRequest as PensionRequest, ...prev]);

          // Notify management
          const managers = users.filter(u => u.role === Role.ADMIN || u.role === Role.HR_MANAGER);
          managers.forEach(mgr => {
            onAddNotification({
              userId: mgr.id,
              title: 'New Pension Request',
              desc: `${user.fullName} submitted a ${pensionForm.retirementCategory} request.`,
              type: 'info'
            });
          });

          // Notify user
          onAddNotification({
            userId: user.id,
            title: 'Pension Request Submitted',
            desc: `Your ${pensionForm.retirementCategory} request has been submitted successfully and is pending HR approval.`,
            type: 'success'
          });

          notificationService.success('Pension request submitted successfully! You will be notified once it is reviewed.');

          setShowSuccess(true);
          setTimeout(() => {
            setShowSuccess(false);
            navigate('/dashboard');
          }, 2000);
        } else {
          const errorMsg = data.message || 'Failed to submit pension request. Please try again.';
          notificationService.error(errorMsg);
          logError({ message: errorMsg, code: 'PENSION_SUBMIT_FAILED', statusCode: 400 }, 'Submit pension');
        }
      } catch (err) {
        const errorDetails = parseApiError(err);
        notificationService.error(errorDetails.message);
        logError(errorDetails, 'Submit pension request');
      } finally {
        setIsSubmitting(false);
      }
    };

    if (pensionForm.supportingDoc) {
      const reader = new FileReader();
      reader.onloadend = () => {
        processSubmit(reader.result as string);
      };
      reader.onerror = () => {
        notificationService.error('Failed to read the file. Please try again.');
        setIsSubmitting(false);
      };
      reader.readAsDataURL(pensionForm.supportingDoc);
    } else {
      processSubmit();
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto pb-20">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Pension Request</h1>
        <p className="text-gray-500 dark:text-gray-400">Submit your retirement pension application</p>
      </header>

      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl shadow-gray-100 dark:shadow-none border border-gray-100 dark:border-gray-700 overflow-hidden relative">
        {showSuccess && (
          <div className="absolute inset-0 z-10 bg-white dark:bg-gray-800 bg-opacity-95 dark:bg-opacity-95 flex flex-col items-center justify-center transition-all animate-in fade-in">
            <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 size={32} />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Request Submitted!</h3>
            <p className="text-gray-500 dark:text-gray-400 mt-2">Your pension application is being processed by HR.</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {/* Employee Information Section */}
          <div className="pb-6 border-b border-gray-100 dark:border-gray-700">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center">
              <UserIcon className="mr-2 text-indigo-600 dark:text-indigo-400" size={20} />
              Current Employee Information
            </h2>

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
                    value={pensionForm.fullName}
                    className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl pl-10 pr-4 py-3 outline-none cursor-not-allowed text-gray-600 dark:text-gray-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Email Address</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                    <Mail size={18} />
                  </span>
                  <input
                    type="email"
                    readOnly
                    value={pensionForm.email}
                    className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl pl-10 pr-4 py-3 outline-none cursor-not-allowed text-gray-600 dark:text-gray-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Department</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                    <Building2 size={18} />
                  </span>
                  <input
                    type="text"
                    readOnly
                    value={pensionForm.department}
                    className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl pl-10 pr-4 py-3 outline-none cursor-not-allowed text-gray-600 dark:text-gray-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Phone Number</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                    <Phone size={18} />
                  </span>
                  <input
                    type="tel"
                    readOnly
                    value={pensionForm.phoneNumber}
                    className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl pl-10 pr-4 py-3 outline-none cursor-not-allowed text-gray-600 dark:text-gray-400"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Pension Details Section */}
          <div className="pb-6 border-b border-gray-100 dark:border-gray-700">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center">
              <FileText className="mr-2 text-indigo-600 dark:text-indigo-400" size={20} />
              Pension Details
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Date of Birth</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400 pointer-events-none">
                    <CalendarIcon size={18} />
                  </span>
                  <input
                    type="date"
                    required
                    value={pensionForm.dateOfBirth}
                    onChange={(e) => setPensionForm({ ...pensionForm, dateOfBirth: e.target.value })}
                    className="w-full bg-white dark:bg-gray-900 pl-10 pr-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-gray-900 dark:text-white"
                  />
                </div>
                {age !== null && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Age: {age} years old</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Retirement Category</label>
                <select
                  required
                  value={pensionForm.retirementCategory}
                  onChange={(e) => setPensionForm({ ...pensionForm, retirementCategory: e.target.value as RetirementCategory })}
                  className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-gray-900 dark:text-white"
                >
                  {Object.values(RetirementCategory).map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Reason Section */}
          <div className="pb-6 border-b border-gray-100 dark:border-gray-700">
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Reason for Pension Request</label>
            <textarea
              required
              rows={4}
              value={pensionForm.reason}
              onChange={(e) => setPensionForm({ ...pensionForm, reason: e.target.value })}
              placeholder="Provide detailed reason for your retirement request..."
              className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500 transition-all resize-none text-gray-900 dark:text-white"
            ></textarea>
          </div>

          {/* Important Information */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/50 rounded-2xl p-4 flex items-start">
            <Info className="text-blue-500 dark:text-blue-400 mr-3 mt-0.5 flex-shrink-0" size={18} />
            <div>
              <h4 className="text-sm font-bold text-blue-800 dark:text-blue-300">Important Information</h4>
              <p className="text-xs text-blue-700 dark:text-blue-400 mt-1 leading-relaxed">
                Your pension request will be reviewed by HR and management. Please ensure all information is accurate and complete. Supporting documents can help expedite the process.
              </p>
            </div>
          </div>

          {/* Supporting Documents */}
          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Supporting Documents (Optional)</label>
            <div className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl p-6 flex flex-col items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer relative">
              <input
                type="file"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                onChange={(e) => setPensionForm({ ...pensionForm, supportingDoc: e.target.files?.[0] || null })}
              />
              <Upload className="text-gray-400 dark:text-gray-500 mb-2" size={24} />
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                {pensionForm.supportingDoc ? pensionForm.supportingDoc.name : 'Click to upload or drag & drop'}
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">PDF, JPG, PNG up to 5MB (Medical certificates, ID copies, etc.)</p>
            </div>
          </div>

          {/* Submit Button */}
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
                Submit Pension Request
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default PensionRequestPage;
