/**
 * In-App Notification Service
 * Manages user notifications with different severity levels and auto-dismissal
 */

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

class NotificationService {
  private listeners: Set<(toast: Toast) => void> = new Set();
  private removeListeners: Set<(id: string) => void> = new Set();
  private toastQueue: Toast[] = [];

  /**
   * Subscribe to toast notifications
   */
  subscribe(callback: (toast: Toast) => void) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  /**
   * Subscribe to toast removal events
   */
  subscribeRemove(callback: (id: string) => void) {
    this.removeListeners.add(callback);
    return () => this.removeListeners.delete(callback);
  }

  /**
   * Generate unique toast ID
   */
  private generateId() {
    return `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Show success notification
   */
  success(message: string, duration: number = 4000) {
    return this.show({
      message,
      type: 'success',
      duration
    });
  }

  /**
   * Show error notification
   */
  error(message: string, duration: number = 6000, action?: { label: string; onClick: () => void }) {
    return this.show({
      message,
      type: 'error',
      duration,
      action
    });
  }

  /**
   * Show warning notification
   */
  warning(message: string, duration: number = 5000) {
    return this.show({
      message,
      type: 'warning',
      duration
    });
  }

  /**
   * Show info notification
   */
  info(message: string, duration: number = 4000) {
    return this.show({
      message,
      type: 'info',
      duration
    });
  }

  /**
   * Show generic toast notification
   */
  private show(toast: Omit<Toast, 'id'>): string {
    const id = this.generateId();
    const newToast: Toast = {
      id,
      ...toast,
      duration: toast.duration || 4000
    };

    this.toastQueue.push(newToast);
    this.listeners.forEach(callback => callback(newToast));

    // Auto-remove after duration if specified
    if (newToast.duration && newToast.duration > 0) {
      setTimeout(() => this.remove(id), newToast.duration);
    }

    return id;
  }

  /**
   * Remove a specific toast
   */
  remove(id: string) {
    this.toastQueue = this.toastQueue.filter(t => t.id !== id);
    this.removeListeners.forEach(callback => callback(id));
  }

  /**
   * Clear all toasts
   */
  clear() {
    const ids = this.toastQueue.map(t => t.id);
    this.toastQueue = [];
    ids.forEach(id => this.removeListeners.forEach(callback => callback(id)));
  }

  /**
   * Get all active toasts
   */
  getAll(): Toast[] {
    return [...this.toastQueue];
  }
}

// Export singleton instance
export const notificationService = new NotificationService();

/**
 * Handle API errors and show notification
 */
export const handleErrorNotification = (
  error: any,
  defaultMessage: string = 'An error occurred. Please try again.'
): string => {
  let message = defaultMessage;

  // Extract error message from various response formats
  if (error?.message && typeof error.message === 'string') {
    message = error.message;
  } else if (error?.error && typeof error.error === 'string') {
    message = error.error;
  } else if (typeof error === 'string') {
    message = error;
  }

  return notificationService.error(message);
};

/**
 * Handle success notifications with optional action
 */
export const handleSuccessNotification = (
  message: string,
  action?: { label: string; onClick: () => void }
): string => {
  return notificationService.success(message);
};

/**
 * API call wrapper with error handling and notifications
 */
export const apiCall = async (
  url: string,
  options: RequestInit = {},
  showNotification: boolean = true
): Promise<any> => {
  try {
    const token = localStorage.getItem('smart_leave_token');
    const headers = {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers
    };

    const response = await fetch(url, {
      ...options,
      headers
    });

    const data = await response.json();

    if (!response.ok) {
      const errorMessage = data?.message || data?.error || `Server error (${response.status})`;
      if (showNotification) {
        notificationService.error(errorMessage);
      }
      throw new Error(errorMessage);
    }

    return data;
  } catch (error: any) {
    if (!(error instanceof Error) || !showNotification) {
      throw error;
    }

    const message = error.message || 'Failed to complete request. Please try again.';
    notificationService.error(message);
    throw error;
  }
};

/**
 * React hook for using notifications
 */
export const useNotification = () => {
  return {
    success: (msg: string, duration?: number) => notificationService.success(msg, duration),
    error: (msg: string, duration?: number) => notificationService.error(msg, duration),
    warning: (msg: string, duration?: number) => notificationService.warning(msg, duration),
    info: (msg: string, duration?: number) => notificationService.info(msg, duration),
    show: (msg: string, type: 'success' | 'error' | 'warning' | 'info', duration?: number) =>
      notificationService.show({ message: msg, type, duration }),
    remove: (id: string) => notificationService.remove(id),
    clear: () => notificationService.clear()
  };
};
