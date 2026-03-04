
import React, { useState, useRef } from 'react';
import { User as UserIcon, Mail, Briefcase, Phone, Shield, Camera, Edit3, Save, X, CheckCircle } from 'lucide-react';
import { User } from '../types';

interface ProfileProps {
  user: User;
  onUpdateUser: (updatedUser: User) => void;
}

const Profile: React.FC<ProfileProps> = ({ user, onUpdateUser }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    fullName: user.fullName,
    email: user.email,
    phoneNumber: user.phoneNumber || '',
    department: user.department,
    avatar: user.avatar || ''
  });

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    try {
      const token = localStorage.getItem('smart_leave_token');
      const updatedUser: User = {
        ...user,
        fullName: formData.fullName,
        email: formData.email,
        phoneNumber: formData.phoneNumber,
        department: formData.department,
        avatar: formData.avatar
      };

      const response = await fetch(`/api/users/${user.id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updatedUser),
      });

      if (response.ok) {
        onUpdateUser(updatedUser);
        setIsSaving(false);
        setIsEditing(false);
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
      } else {
        alert('Failed to update profile.');
        setIsSaving(false);
      }
    } catch (err) {
      console.error('Profile update error:', err);
      alert('Connection error. Please try again.');
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      fullName: user.fullName,
      email: user.email,
      phoneNumber: user.phoneNumber || '',
      department: user.department,
      avatar: user.avatar || ''
    });
    setIsEditing(false);
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setFormData(prev => ({ ...prev, avatar: base64String }));
        
        // Auto-save avatar change
        const updatedUser: User = {
          ...user,
          avatar: base64String
        };

        const token = localStorage.getItem('smart_leave_token');
        fetch(`/api/users/${user.id}`, {
          method: 'PUT',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(updatedUser),
        }).then(res => {
          if (res.ok) {
            onUpdateUser(updatedUser);
            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 3000);
          }
        });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto pb-20">
      <header className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Personal Profile</h1>
          <p className="text-gray-500 dark:text-gray-400">View and manage your account information</p>
        </div>
        {showSuccess && (
          <div className="flex items-center space-x-2 text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 px-4 py-2 rounded-xl border border-emerald-100 dark:border-emerald-800 animate-in fade-in slide-in-from-top-2">
            <CheckCircle size={18} />
            <span className="text-sm font-bold">Profile Updated!</span>
          </div>
        )}
      </header>

      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl shadow-gray-100 dark:shadow-none border border-gray-100 dark:border-gray-700 overflow-hidden">
        {/* Banner */}
        <div className="h-32 bg-gradient-to-r from-indigo-500 to-purple-600"></div>
        
        <div className="px-8 pb-8">
          <div className="flex flex-col md:flex-row md:items-end -mt-12 mb-10 gap-6">
            <div className="relative group">
              <div className="w-32 h-32 rounded-3xl bg-white dark:bg-gray-800 p-1 shadow-xl overflow-hidden">
                <div className="w-full h-full bg-indigo-100 dark:bg-indigo-900/30 rounded-2xl flex items-center justify-center text-indigo-600 dark:text-indigo-400 text-4xl font-black overflow-hidden">
                  {formData.avatar ? (
                    <img src={formData.avatar} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    formData.fullName.charAt(0)
                  )}
                </div>
              </div>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                className="hidden" 
                accept="image/*"
              />
              <button 
                onClick={handleAvatarClick}
                className="absolute bottom-2 right-2 p-2 bg-white dark:bg-gray-700 rounded-xl shadow-lg text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors border border-gray-100 dark:border-gray-600"
              >
                <Camera size={18} />
              </button>
            </div>
            
            <div className="flex-1 pb-2">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{formData.fullName}</h2>
              <p className="text-indigo-600 dark:text-indigo-400 font-semibold">{user.role}</p>
            </div>
            
            <div className="pb-2">
              {!isEditing ? (
                <button 
                  onClick={() => setIsEditing(true)}
                  className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold flex items-center hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 dark:shadow-none"
                >
                  <Edit3 className="mr-2" size={16} />
                  Edit Profile
                </button>
              ) : (
                <div className="flex items-center space-x-2">
                  <button 
                    onClick={handleCancel}
                    className="px-4 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-xl text-sm font-bold flex items-center hover:bg-gray-200 dark:hover:bg-gray-600 transition-all"
                  >
                    <X className="mr-2" size={16} />
                    Cancel
                  </button>
                  <button 
                    onClick={handleSave}
                    disabled={isSaving}
                    className="px-6 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-bold flex items-center hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 dark:shadow-none disabled:opacity-50"
                  >
                    {isSaving ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                    ) : (
                      <Save className="mr-2" size={16} />
                    )}
                    Save Changes
                  </button>
                </div>
              )}
            </div>
          </div>

          <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest border-b border-gray-50 dark:border-gray-700 pb-2">Basic Information</h3>
              
              <div className="flex items-start space-x-4">
                <div className="p-2.5 bg-gray-50 dark:bg-gray-900 text-gray-400 dark:text-gray-500 rounded-xl">
                  <UserIcon size={20} />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase">Full Legal Name</p>
                  {isEditing ? (
                    <input 
                      type="text"
                      value={formData.fullName}
                      onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                      className="w-full mt-1 px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-semibold text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                      required
                    />
                  ) : (
                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 mt-0.5">{formData.fullName}</p>
                  )}
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="p-2.5 bg-gray-50 dark:bg-gray-900 text-gray-400 dark:text-gray-500 rounded-xl">
                  <Mail size={20} />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase">Email Address</p>
                  {isEditing ? (
                    <input 
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className="w-full mt-1 px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-semibold text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                      required
                    />
                  ) : (
                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 mt-0.5">{formData.email}</p>
                  )}
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="p-2.5 bg-gray-50 dark:bg-gray-900 text-gray-400 dark:text-gray-500 rounded-xl">
                  <Phone size={20} />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase">Phone Number</p>
                  {isEditing ? (
                    <input 
                      type="tel"
                      value={formData.phoneNumber}
                      onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})}
                      className="w-full mt-1 px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-semibold text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                      placeholder="+250 XXX XXX XXX"
                    />
                  ) : (
                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 mt-0.5">{formData.phoneNumber || 'Not provided'}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest border-b border-gray-50 dark:border-gray-700 pb-2">Employment Details</h3>
              
              <div className="flex items-start space-x-4">
                <div className="p-2.5 bg-gray-50 dark:bg-gray-900 text-gray-400 dark:text-gray-500 rounded-xl">
                  <Briefcase size={20} />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase">Department</p>
                  {isEditing && user.role.includes('Admin') ? (
                    <select 
                      value={formData.department}
                      onChange={(e) => setFormData({...formData, department: e.target.value})}
                      className="w-full mt-1 px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-semibold text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    >
                      {['Engineering', 'Marketing', 'Sales', 'Human Resources', 'Finance', 'Operations', 'Administration'].map(d => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  ) : (
                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 mt-0.5">{formData.department}</p>
                  )}
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="p-2.5 bg-gray-50 dark:bg-gray-900 text-gray-400 dark:text-gray-500 rounded-xl">
                  <Shield size={20} />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase">Access Role</p>
                  <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 mt-0.5">{user.role}</p>
                </div>
              </div>

              <div className="mt-8 p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl border border-indigo-100 dark:border-indigo-800">
                <h4 className="text-xs font-bold text-indigo-900 dark:text-indigo-300 uppercase">System Integrity</h4>
                <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-1 leading-relaxed">
                  Your profile data is protected with 256-bit encryption. Updates require HR verification for legal compliance.
                </p>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Profile;
