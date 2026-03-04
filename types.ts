
export enum Role {
  EMPLOYEE = 'Employee',
  ADMIN = 'Admin',
  HR_MANAGER = 'HR Manager'
}

export enum LeaveStatus {
  PENDING = 'Pending',
  APPROVED = 'Approved',
  REJECTED = 'Rejected'
}

export enum LeaveCategory {
  SICK = 'Sick Leave',
  ANNUAL = 'Annual Leave',
  MATERNITY = 'Maternity Leave',
  PATERNITY = 'Paternity Leave',
  UNPAID = 'Unpaid Leave',
  EMERGENCY = 'Emergency Leave'
}

export interface User {
  id: string;
  fullName: string;
  email: string;
  department: string;
  role: Role;
  phoneNumber?: string;
  idNumber?: string;
  avatar?: string;
  password?: string;
}

export interface Department {
  id: string;
  name: string;
  head: string;
  members: number;
  status: 'Active' | 'Inactive';
}

export interface LeaveRequest {
  id: string;
  userId: string;
  fullName: string;
  category: LeaveCategory;
  startDate: string;
  endDate: string;
  reason: string;
  status: LeaveStatus;
  appliedDate: string;
  supportingDoc?: string;
}

export interface EncashmentRequest {
  id: string;
  userId: string;
  fullName: string;
  daysToSell: number;
  status: LeaveStatus;
  reason: string;
  appliedDate: string;
  supportingDoc?: string;
}

export interface Holiday {
  id: string;
  name: string;
  date: string;
}

export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  desc: string;
  time: string;
  type: 'success' | 'info' | 'error' | 'warning';
  read: boolean;
}

export interface LeaveBalance {
  userId: string;
  category: string;
  balance: number;
}
