import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, AlertTriangle, Info, X } from 'lucide-react';
import { Toast, notificationService } from '../services/notificationService';

/**
 * Toast UI Component
 * Displays notifications at the top of the screen with auto-dismiss
 */
const ToastContainer: React.FC = () => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    // Subscribe to new toasts
    const unsubscribeAdd = notificationService.subscribe((toast: Toast) => {
      setToasts(prev => [...prev, toast]);
    });

    // Subscribe to toast removal
    const unsubscribeRemove = notificationService.subscribeRemove((id: string) => {
      setToasts(prev => prev.filter(t => t.id !== id));
    });

    return () => {
      unsubscribeAdd();
      unsubscribeRemove();
    };
  }, []);

  const getIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle size={20} className="text-green-500" />;
      case 'error':
        return <AlertCircle size={20} className="text-red-500" />;
      case 'warning':
        return <AlertTriangle size={20} className="text-yellow-500" />;
      case 'info':
      default:
        return <Info size={20} className="text-blue-500" />;
    }
  };

  const getStyles = (type: string) => {
    switch (type) {
      case 'success':
        return {
          bg: 'bg-green-50 dark:bg-green-900/20',
          border: 'border-green-200 dark:border-green-800/50',
          text: 'text-green-800 dark:text-green-200'
        };
      case 'error':
        return {
          bg: 'bg-red-50 dark:bg-red-900/20',
          border: 'border-red-200 dark:border-red-800/50',
          text: 'text-red-800 dark:text-red-200'
        };
      case 'warning':
        return {
          bg: 'bg-yellow-50 dark:bg-yellow-900/20',
          border: 'border-yellow-200 dark:border-yellow-800/50',
          text: 'text-yellow-800 dark:text-yellow-200'
        };
      case 'info':
      default:
        return {
          bg: 'bg-blue-50 dark:bg-blue-900/20',
          border: 'border-blue-200 dark:border-blue-800/50',
          text: 'text-blue-800 dark:text-blue-200'
        };
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm space-y-3 pointer-events-none">
      {toasts.map(toast => {
        const styles = getStyles(toast.type);

        return (
          <div
            key={toast.id}
            className={`
              ${styles.bg} ${styles.border}
              border rounded-lg p-4 shadow-lg backdrop-blur-sm
              animate-in fade-in slide-in-from-top-2 duration-300
              pointer-events-auto
            `}
          >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5">
                {getIcon(toast.type)}
              </div>
              <div className="flex-1">
                <p className={`${styles.text} font-medium text-sm leading-relaxed`}>
                  {toast.message}
                </p>
              </div>
              <button
                onClick={() => notificationService.remove(toast.id)}
                className={`${styles.text} opacity-60 hover:opacity-100 transition-opacity flex-shrink-0 mt-0.5`}
              >
                <X size={18} />
              </button>
            </div>
            {toast.action && (
              <button
                onClick={() => {
                  toast.action?.onClick();
                  notificationService.remove(toast.id);
                }}
                className={`mt-2 text-sm font-semibold ${styles.text} hover:underline`}
              >
                {toast.action.label}
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default ToastContainer;
