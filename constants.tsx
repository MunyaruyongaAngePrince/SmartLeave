
import { Role, LeaveStatus, LeaveCategory, User, LeaveRequest, Holiday, Department } from './types';

// Helper to get current month/year strings
const now = new Date();
const currentMonth = String(now.getMonth() + 1).padStart(2, '0');
const currentYear = now.getFullYear();
const todayStr = `${currentYear}-${currentMonth}-${String(now.getDate()).padStart(2, '0')}`;
const earlierThisMonth = `${currentYear}-${currentMonth}-01`;

export const MOCK_USERS: User[] = [
  {
    id: '1',
    fullName: 'John Doe',
    email: 'john@company.com',
    department: 'Engineering',
    role: Role.EMPLOYEE,
    phoneNumber: '+250 788 123 456',
    password: 'password123'
  },
  {
    id: '2',
    fullName: 'Jane Smith',
    email: 'jane@company.com',
    department: 'Human Resources',
    role: Role.HR_MANAGER,
    phoneNumber: '+250 788 000 111',
    password: 'password123'
  },
  {
    id: '3',
    fullName: 'Admin User',
    email: 'admin@company.com',
    department: 'Administration',
    role: Role.ADMIN,
    phoneNumber: '+250 788 999 888',
    password: 'password123'
  },
  {
    id: '4',
    fullName: 'Alice Uwase',
    email: 'alice@company.com',
    department: 'Marketing',
    role: Role.EMPLOYEE,
    phoneNumber: '+250 788 222 333'
  },
  {
    id: '5',
    fullName: 'Bob Kagame',
    email: 'bob@company.com',
    department: 'Engineering',
    role: Role.EMPLOYEE,
    phoneNumber: '+250 788 444 555'
  },
  {
    id: '6',
    fullName: 'Clarisse Mutesi',
    email: 'clarisse@company.com',
    department: 'Finance',
    role: Role.EMPLOYEE,
    phoneNumber: '+250 788 666 777'
  }
];

export const MOCK_DEPARTMENTS: Department[] = [
  { id: '1', name: 'Engineering', head: 'Bob Kagame', members: 0, status: 'Active' },
  { id: '2', name: 'Marketing', head: 'Alice Uwase', members: 0, status: 'Active' },
  { id: '3', name: 'Finance', head: 'Clarisse Mutesi', members: 0, status: 'Active' },
  { id: '4', name: 'Human Resources', head: 'Jane Smith', members: 0, status: 'Active' },
  { id: '5', name: 'Sales', head: 'David Rukundo', members: 0, status: 'Active' },
  { id: '6', name: 'Administration', head: 'Admin User', members: 0, status: 'Active' },
];

export const MOCK_LEAVES: LeaveRequest[] = [
  {
    id: 'req1',
    userId: '1',
    fullName: 'John Doe',
    category: LeaveCategory.ANNUAL,
    startDate: todayStr,
    endDate: todayStr, 
    reason: 'Family vacation',
    status: LeaveStatus.APPROVED,
    appliedDate: earlierThisMonth
  },
  {
    id: 'req2',
    userId: '1',
    fullName: 'John Doe',
    category: LeaveCategory.SICK,
    startDate: todayStr,
    endDate: todayStr,
    reason: 'Flu symptoms',
    status: LeaveStatus.PENDING,
    appliedDate: todayStr
  },
  {
    id: 'req3',
    userId: '4',
    fullName: 'Alice Uwase',
    category: LeaveCategory.EMERGENCY,
    startDate: todayStr,
    endDate: todayStr,
    reason: 'Home emergency',
    status: LeaveStatus.PENDING,
    appliedDate: todayStr
  }
];

export const HOLIDAYS: Holiday[] = [
  { id: 'h1', name: 'New Year Day', date: '2026-01-01' },
  { id: 'h2', name: 'New Year Holiday', date: '2026-01-02' },
  { id: 'h3', name: 'National Heroes Day', date: '2026-02-01' },
  { id: 'h4', name: 'Eid al-Fitr', date: '2026-03-20' },
  { id: 'h5', name: 'Good Friday', date: '2026-04-03' },
  { id: 'h6', name: 'Easter Monday', date: '2026-04-06' },
  { id: 'h7', name: 'Genocide Memorial Day', date: '2026-04-07' },
  { id: 'h8', name: 'Labor Day', date: '2026-05-01' },
  { id: 'h9', name: 'Eid al-Adha', date: '2026-05-27' },
  { id: 'h10', name: 'Independence Day', date: '2026-07-01' },
  { id: 'h11', name: 'Liberation Day', date: '2026-07-04' },
  { id: 'h12', name: 'Umuganura (Harvest Day)', date: '2026-08-07' },
  { id: 'h13', name: 'Assumption Day', date: '2026-08-15' },
  { id: 'h14', name: 'Christmas Day', date: '2026-12-25' },
  { id: 'h15', name: 'Boxing Day', date: '2026-12-26' }
];
