
-- SmartLeave Database Schema (MySQL)

CREATE DATABASE IF NOT EXISTS smartleave_db;
USE smartleave_db;

-- Users Table
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(50) PRIMARY KEY,
    fullName VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    department VARCHAR(50) NOT NULL,
    role ENUM('Employee', 'Admin', 'HR Manager') NOT NULL,
    phoneNumber VARCHAR(20),
    idNumber VARCHAR(16)unique,
    avatar LONGTEXT,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Departments Table
CREATE TABLE IF NOT EXISTS departments (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    head VARCHAR(100),
    status ENUM('Active', 'Inactive') DEFAULT 'Active'
);

-- Leave Requests Table
CREATE TABLE IF NOT EXISTS leave_requests (
    id VARCHAR(50) PRIMARY KEY,
    userId VARCHAR(50) NOT NULL,
    fullName VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL,
    startDate DATE NOT NULL,
    endDate DATE NOT NULL,
    reason TEXT,
    status ENUM('Pending', 'Approved', 'Rejected') DEFAULT 'Pending',
    appliedDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    supportingDoc LONGTEXT,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

-- Encashment Requests Table
CREATE TABLE IF NOT EXISTS encashment_requests (
    id VARCHAR(50) PRIMARY KEY,
    userId VARCHAR(50) NOT NULL,
    fullName VARCHAR(100) NOT NULL,
    daysToSell INT NOT NULL,
    status ENUM('Pending', 'Approved', 'Rejected') DEFAULT 'Pending',
    reason TEXT,
    appliedDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

-- Pension Requests Table
CREATE TABLE IF NOT EXISTS pension_requests (
    id VARCHAR(50) PRIMARY KEY,
    userId VARCHAR(50) NOT NULL,
    fullName VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL,
    department VARCHAR(50) NOT NULL,
    phoneNumber VARCHAR(20),
    dateOfBirth DATE NOT NULL,
    retirementCategory ENUM('Normal Retirement', 'Early Retirement', 'Medical Retirement') NOT NULL,
    reason TEXT NOT NULL,
    status ENUM('Pending', 'Approved', 'Rejected') DEFAULT 'Pending',
    appliedDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    supportingDoc LONGTEXT,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

-- Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
    id VARCHAR(50) PRIMARY KEY,
    userId VARCHAR(50) NOT NULL,
    title VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    type ENUM('success', 'info', 'error', 'warning') DEFAULT 'info',
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

-- Holidays Table
CREATE TABLE IF NOT EXISTS holidays (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    date DATE NOT NULL,
    type ENUM('Public', 'Company') DEFAULT 'Public',
    is_annual BOOLEAN DEFAULT TRUE COMMENT 'If true, holiday recurs annually on the same month-day'
);

-- Leave Balances Table
CREATE TABLE IF NOT EXISTS leave_balances (
    userId VARCHAR(50) NOT NULL,
    category VARCHAR(100) NOT NULL,
    balance DOUBLE DEFAULT 21,
    PRIMARY KEY (userId, category),
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

-- Initial Data
INSERT IGNORE INTO users (id, fullName, email, department, role, password) VALUES 
('u1', 'John Doe', 'john@company.com', 'Engineering', 'Employee', 'password123'),
('u2', 'Jane Smith', 'jane@company.com', 'Human Resources', 'HR Manager', 'password123');

INSERT IGNORE INTO departments (id, name, head, status) VALUES 
('d1', 'Engineering', 'Robert Wilson', 'Active'),
('d2', 'Marketing', 'Sarah Jenkins', 'Active'),
('d3', 'Human Resources', 'Jane Smith', 'Active');

INSERT IGNORE INTO holidays (id, name, date, type, is_annual) VALUES
('h1', 'New Year''s Day', '2026-01-01', 'Public', TRUE),
('h2', 'Heroes'' Day', '2026-02-01', 'Public', TRUE),
('h3', 'Tutsi Genocide Memorial Day', '2026-04-07', 'Public', TRUE),
('h4', 'Independence Day', '2026-07-01', 'Public', TRUE),
('h5', 'Liberation Day', '2026-07-04', 'Public', TRUE),
('h6', 'Umuganura Day', '2026-08-01', 'Public', TRUE),
('h7', 'Christmas Day', '2026-12-25', 'Public', TRUE),
('h8', 'Boxing Day', '2026-12-26', 'Public', TRUE);

INSERT IGNORE INTO leave_balances (userId, category, balance) VALUES 
('u1', 'Annual Leave', 21),
('u1', 'Sick Leave', 15),
('u1', 'Maternity Leave', 15),
('u1', 'Paternity Leave', 15),
('u1', 'Emergency Leave', 15),
('u2', 'Annual Leave', 21),
('u2', 'Sick Leave', 15),
('u2', 'Maternity Leave', 15),
('u2', 'Paternity Leave', 15),
('u2', 'Emergency Leave', 15);
