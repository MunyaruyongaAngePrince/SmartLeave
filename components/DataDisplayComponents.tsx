import React from 'react';
import { LucideIcon } from 'lucide-react';

/**
 * Reusable Info Card Component
 * Displays key-value information in a consistent card format
 */
interface InfoCardProps {
  label: string;
  value: string | number | React.ReactNode;
  icon?: LucideIcon;
  highlight?: boolean;
  className?: string;
}

export const InfoCard: React.FC<InfoCardProps> = ({ 
  label, 
  value, 
  icon: Icon,
  highlight = false,
  className = ''
}) => {
  return (
    <div className={`flex items-center justify-between p-3 rounded-xl ${
      highlight 
        ? 'bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800/50' 
        : 'bg-gray-50 dark:bg-gray-900/50'
    } ${className}`}>
      <div className="flex items-center gap-2">
        {Icon && <Icon size={14} className="text-gray-400" />}
        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{label}</span>
      </div>
      <span className={`text-sm font-bold ${
        highlight 
          ? 'text-indigo-600 dark:text-indigo-400' 
          : 'text-gray-900 dark:text-gray-100'
      }`}>
        {value}
      </span>
    </div>
  );
};

/**
 * Reusable Status Badge Component
 */
interface StatusBadgeProps {
  status: 'Active' | 'Inactive' | 'Pending' | 'Approved' | 'Rejected' | 'Success' | 'Error' | 'Warning';
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = '' }) => {
  const styles = {
    'Active': 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300',
    'Inactive': 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300',
    'Pending': 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300',
    'Approved': 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
    'Rejected': 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300',
    'Success': 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300',
    'Error': 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300',
    'Warning': 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300',
  };

  return (
    <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${styles[status]} ${className}`}>
      {status}
    </span>
  );
};

/**
 * Reusable Card Component for displaying items
 */
interface CardProps {
  icon?: LucideIcon;
  iconColor?: string;
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
  onClick?: () => void;
  isActive?: boolean;
  isDeleteMode?: boolean;
  onDeleteClick?: (e: React.MouseEvent) => void;
  className?: string;
}

export const Card: React.FC<CardProps> = ({
  icon: Icon,
  iconColor = 'bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600',
  title,
  subtitle,
  children,
  onClick,
  isActive = false,
  isDeleteMode = false,
  onDeleteClick,
  className = ''
}) => {
  return (
    <div
      onClick={onClick}
      className={`
        bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 
        transition-all group relative ${isDeleteMode ? 'cursor-default ring-2 ring-red-100 dark:ring-red-900/30' : 'cursor-pointer hover:shadow-md'}
        ${isActive ? 'ring-2 ring-indigo-500' : ''}
        ${className}
      `}
    >
      {onDeleteClick && isDeleteMode && (
        <button
          onClick={onDeleteClick}
          className="absolute -top-3 -right-3 w-8 h-8 bg-red-600 text-white rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform animate-in zoom-in"
        >
          ✕
        </button>
      )}

      {Icon && (
        <div className={`w-12 h-12 ${iconColor} rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 mb-4`}>
          <Icon size={24} />
        </div>
      )}

      <h3 className="text-xl font-bold text-gray-900 dark:text-white">{title}</h3>
      {subtitle && (
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{subtitle}</p>
      )}

      {children && <div className="mt-4">{children}</div>}
    </div>
  );
};

/**
 * Reusable List Item Component
 */
interface ListItemProps {
  label: string;
  value: string | React.ReactNode;
  icon?: LucideIcon;
  className?: string;
}

export const ListItem: React.FC<ListItemProps> = ({
  label,
  value,
  icon: Icon,
  className = ''
}) => {
  return (
    <div className={`flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-700 last:border-b-0 ${className}`}>
      <div className="flex items-center gap-3">
        {Icon && <Icon size={16} className="text-gray-400" />}
        <span className="text-sm text-gray-600 dark:text-gray-400">{label}</span>
      </div>
      <span className="text-sm font-semibold text-gray-900 dark:text-white">{value}</span>
    </div>
  );
};

/**
 * Reusable Error Message Component
 */
interface ErrorMessageProps {
  message: string;
  icon?: LucideIcon;
  className?: string;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({
  message,
  icon: Icon,
  className = ''
}) => {
  return (
    <div className={`p-4 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 text-sm rounded-xl border border-red-200 dark:border-red-800/50 flex gap-3 items-start ${className}`}>
      {Icon ? (
        <Icon size={20} className="flex-shrink-0 mt-0.5" />
      ) : (
        <span className="text-red-500 font-bold text-lg flex-shrink-0">⚠</span>
      )}
      <div className="flex-1">
        <p className="leading-relaxed">{message}</p>
      </div>
    </div>
  );
};

/**
 * Reusable Success Message Component
 */
interface SuccessMessageProps {
  message: string;
  icon?: LucideIcon;
  className?: string;
}

export const SuccessMessage: React.FC<SuccessMessageProps> = ({
  message,
  icon: Icon,
  className = ''
}) => {
  return (
    <div className={`p-4 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 text-sm rounded-xl border border-emerald-200 dark:border-emerald-800/50 flex gap-3 items-start ${className}`}>
      {Icon ? (
        <Icon size={20} className="flex-shrink-0 mt-0.5" />
      ) : (
        <span className="text-emerald-500 font-bold text-lg flex-shrink-0">✓</span>
      )}
      <div className="flex-1">
        <p className="leading-relaxed">{message}</p>
      </div>
    </div>
  );
};

/**
 * Reusable Grid Layout Component
 */
interface GridLayoutProps {
  children: React.ReactNode;
  columns?: 1 | 2 | 3 | 4;
  gap?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const GridLayout: React.FC<GridLayoutProps> = ({
  children,
  columns = 3,
  gap = 'md',
  className = ''
}) => {
  const columnClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
  };

  const gapClasses = {
    sm: 'gap-4',
    md: 'gap-6',
    lg: 'gap-8',
  };

  return (
    <div className={`grid ${columnClasses[columns]} ${gapClasses[gap]} ${className}`}>
      {children}
    </div>
  );
};

/**
 * Reusable Empty State Component
 */
interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  action,
  className = ''
}) => {
  return (
    <div className={`text-center py-12 md:py-20 ${className}`}>
      <div className="w-16 h-16 bg-gray-50 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300 dark:text-gray-600">
        <Icon size={32} />
      </div>
      <h3 className="text-lg font-bold text-gray-900 dark:text-white">{title}</h3>
      <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">{description}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="mt-6 px-6 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
        >
          {action.label}
        </button>
      )}
    </div>
  );
};
