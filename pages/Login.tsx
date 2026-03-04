import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, LogIn, CalendarCheck, Eye, EyeOff, ArrowLeft, AlertCircle } from 'lucide-react';
import { User } from '../types';
import { notificationService, handleErrorNotification } from '../services/notificationService';
import { parseApiError, logError } from '../services/errorHandler';

interface LoginProps {
  onLogin: (user: User, token?: string) => void;
  users: User[];
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Input validation
    if (!email || !password) {
      setError('Please enter both email and password.');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (data.success) {
        notificationService.success(`Welcome back, ${data.user.fullName}!`);
        onLogin(data.user, data.token);
        navigate('/');
      } else {
        // Show specific error message from server
        const errorMsg = data.message || 'Login failed. Please try again.';
        setError(errorMsg);
        logError({ message: errorMsg, code: 'LOGIN_FAILED', statusCode: 401 }, 'Login attempt');
      }
    } catch (err) {
      const errorDetails = parseApiError(err);
      setError(errorDetails.message);
      logError(errorDetails, 'Login request');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (!forgotEmail) {
      notificationService.error('Please enter your email address.');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail, newPassword: 'password123' }), // Reset to default for demo
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        setForgotSuccess(true);
        notificationService.success('Password reset successful! Your temporary password has been sent to your email.');
        setTimeout(() => {
          setShowForgotModal(false);
          setForgotSuccess(false);
          setForgotEmail('');
        }, 3000);
      } else {
        const errorMsg = data.message || 'Failed to reset password. Please try again.';
        notificationService.error(errorMsg);
        logError({ message: errorMsg, code: 'RESET_FAILED', statusCode: 400 }, 'Password reset');
      }
    } catch (err) {
      const errorDetails = parseApiError(err);
      notificationService.error(errorDetails.message);
      logError(errorDetails, 'Password reset request');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-indigo-50 dark:bg-gray-950 px-4 transition-colors">
      <div className="max-w-md w-full">
        <div className="mb-6">
          <Link 
            to="/" 
            className="inline-flex items-center text-sm font-bold text-indigo-600 dark:text-indigo-400 hover:gap-2 transition-all"
          >
            <ArrowLeft size={18} className="mr-1" />
            Back to Home
          </Link>
        </div>

        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center p-3 bg-white dark:bg-gray-800 rounded-2xl shadow-xl shadow-indigo-100 dark:shadow-none mb-4">
            <CalendarCheck className="text-indigo-600 dark:text-indigo-400" size={32} />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Welcome Back</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2">Sign in to manage your leave requests</p>
        </div>

        <div className="bg-white dark:bg-gray-900 p-8 rounded-3xl shadow-xl shadow-indigo-100 dark:shadow-none border border-transparent dark:border-gray-800">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Email Address</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                  <Mail size={18} />
                </span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:text-white outline-none transition-all"
                  placeholder="name@company.com"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Password</label>
                <button 
                  type="button"
                  onClick={() => setShowForgotModal(true)}
                  className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                  <Lock size={18} />
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-12 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:text-white outline-none transition-all"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-indigo-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 text-sm rounded-xl border border-red-200 dark:border-red-800/50 flex gap-3 items-start animate-in fade-in duration-300">
                <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold mb-0.5">Login Failed</p>
                  <p className="text-red-600 dark:text-red-400">{error}</p>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-indigo-600 text-white font-bold py-3 px-4 rounded-xl hover:bg-indigo-700 focus:ring-4 focus:ring-indigo-100 dark:focus:ring-indigo-900 transition-all flex items-center justify-center"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <LogIn className="mr-2" size={18} />
                  Login to Account
                </>
              )}
            </button>

            <div className="grid grid-cols-2 gap-4 pt-2">
            </div>
          </form>
          <div className="border-t border-gray-100 dark:border-gray-800 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Don't have an account?{' '}
              <Link to="/register" className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline">
                Register here
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white dark:bg-gray-900 w-full max-w-md rounded-[32px] p-8 shadow-2xl animate-in zoom-in-95 duration-300">
            {!forgotSuccess ? (
              <>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Reset Password</h2>
                <p className="text-gray-500 dark:text-gray-400 mb-6">Enter your email and we'll send you instructions to reset your password.</p>
                <form onSubmit={handleForgotSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Email Address</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                        <Mail size={18} />
                      </span>
                      <input
                        type="email"
                        required
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white"
                        placeholder="name@company.com"
                      />
                    </div>
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowForgotModal(false)}
                      className="flex-1 py-3 px-4 rounded-xl border border-gray-200 dark:border-gray-700 font-bold text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="flex-1 py-3 px-4 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition-all flex items-center justify-center"
                    >
                      {isLoading ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      ) : 'Send Link'}
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <div className="text-center py-4">
                <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Mail size={32} />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Check Your Email</h2>
                <p className="text-gray-500 dark:text-gray-400 mb-6">We've sent password reset instructions to <strong>{forgotEmail}</strong>.</p>
                <button
                  onClick={() => {
                    setShowForgotModal(false);
                    setForgotSuccess(false);
                    setForgotEmail('');
                  }}
                  className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all"
                >
                  Back to Login
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;