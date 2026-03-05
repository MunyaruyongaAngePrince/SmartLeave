import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { initDb, getDb, getEngine } from './db';
import { sendLoginNotification, sendLeaveStatusNotification } from './services/emailService';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const JWT_SECRET = process.env.JWT_SECRET || 'smart-leave-secret-key-2026';

// Error response helper
interface ErrorResponse {
  success: false;
  message: string;
  code?: string;
  details?: string;
}

const sendError = (res: any, statusCode: number, message: string, code?: string, details?: string) => {
  const response: ErrorResponse = {
    success: false,
    message,
    ...(code && { code }),
    ...(details && { details })
  };
  res.status(statusCode).json(response);
};

// DB Error handler
const handleDbError = (error: any, context: string = ''): { message: string; code?: string; status: number } => {
  console.error(`[DB ERROR] ${context}:`, error);

  let message = 'Database operation failed. Please try again.';
  let code = 'DB_ERROR';
  let status = 500;

  if (error?.code === 'ER_DUP_ENTRY') {
    status = 409;
    const fieldMatch = error?.sqlMessage?.match(/Duplicate entry '.*?' for key '(.+?)'/);
    const field = fieldMatch?.[1];
    
    if (field === 'email' || error?.sqlMessage?.includes('email')) {
      message = 'This email address is already in use. Please use a different email.';
      code = 'DUPLICATE_EMAIL';
    } else if (field === 'PRIMARY') {
      message = 'This record already exists. Please check your information.';
      code = 'DUPLICATE_RECORD';
    } else {
      message = `This ${field || 'field'} is already registered. Please use a different one.`;
      code = 'DUPLICATE_FIELD';
    }
  } else if (error?.code === 'ER_NO_REFERENCED_ROW_2') {
    status = 400;
    message = 'Invalid reference: The referenced record does not exist.';
    code = 'INVALID_REFERENCE';
  } else if (error?.code === 'ER_BAD_NULL_ERROR') {
    status = 400;
    message = 'Required field is missing. Please provide all necessary information.';
    code = 'MISSING_FIELD';
  } else if (error?.code === 'PROTOCOL_ERROR' || error?.code === 'ECONNREFUSED') {
    message = 'Database connection error. Please try again in a moment.';
    code = 'DB_CONNECTION_ERROR';
  } else if (error?.code === 'ER_ACCESS_DENIED_ERROR') {
    message = 'Database access denied. Please contact system administrator.';
    code = 'DB_ACCESS_DENIED';
  }

  return { message, code, status };
};

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Initialize Database
  const db = await initDb();

  app.use(cors());
  app.use(express.json({ limit: '10mb' }));

  // --- MIDDLEWARE ---
  
  // Request logging middleware
  app.use((req: any, res: any, next: any) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
  });

  // Error handling middleware
  app.use((err: any, req: any, res: any, next: any) => {
    console.error('[ERROR] Unhandled middleware error:', err);
    sendError(res, 500, 'An unexpected error occurred. Please try again later.');
  });

  const authenticateToken = (req: any, res: any, next: any) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return sendError(res, 401, 'Authentication token is required. Please login.', 'MISSING_TOKEN');
    }

    jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
      if (err) {
        if (err.name === 'TokenExpiredError') {
          return sendError(res, 401, 'Your session has expired. Please login again.', 'TOKEN_EXPIRED');
        }
        return sendError(res, 403, 'Invalid authentication token. Please login again.', 'INVALID_TOKEN');
      }
      req.user = user;
      next();
    });
  };

  // --- API ROUTES ---

  // Health Check
  app.get('/api/health', async (req, res) => {
    try {
      const [userRows] = await db.query('SELECT COUNT(*) as count FROM users');
      const userCount = (userRows as any[])[0];
      const [leaveRows] = await db.query('SELECT COUNT(*) as count FROM leave_requests');
      const leaveCount = (leaveRows as any[])[0];
      res.json({ 
        success: true,
        status: 'ok', 
        message: 'SmartLeave API is running',
        engine: getEngine(),
        db: {
          users: userCount?.count || 0,
          leaves: leaveCount?.count || 0
        }
      });
    } catch (error) {
      const { message, code, status } = handleDbError(error, 'Health check');
      sendError(res, status, message, code);
    }
  });

  // Auth & Users
  app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return sendError(res, 400, 'Email and password are required.', 'MISSING_CREDENTIALS');
    }

    try {
      const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
      const user = (rows as any[])[0];

      if (!user) {
        // Generic message to prevent email enumeration
        return sendError(res, 401, 'Invalid email or password. Please try again.', 'INVALID_CREDENTIALS');
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return sendError(res, 401, 'Invalid email or password. Please try again.', 'INVALID_CREDENTIALS');
      }

      // Generate JWT
      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      // Remove password from response
      const { password: _, ...userWithoutPassword } = user;
      
      // Send Login Notification (Async) - don't block response
      sendLoginNotification(user.email, user.fullName).catch(err => console.error('[EMAIL] Login notification failed:', err));

      console.log(`[AUTH] User logged in: ${email}`);
      res.json({ success: true, user: userWithoutPassword, token });
    } catch (error) {
      const { message, code, status } = handleDbError(error, 'Login attempt');
      sendError(res, status, message, code);
    }
  });

  app.post('/api/auth/register', async (req, res) => {
    const { id, fullName, email, department, role, phoneNumber, idNumber, password } = req.body;

    // Input validation
    if (!fullName || !email || !password || !department) {
      return sendError(res, 400, 'All required fields must be completed.', 'MISSING_FIELD');
    }

    if (password.length < 6) {
      return sendError(res, 400, 'Password must be at least 6 characters long.', 'WEAK_PASSWORD');
    }

    try {
      // Check if user already exists
      const [existingRows] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
      const existing = (existingRows as any[])[0];
      if (existing) {
        return sendError(res, 409, 'This email address is already registered. Please use a different email or login to your account.', 'DUPLICATE_EMAIL');
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      
      console.log(`[AUTH] Registering user: ${email}`);
      await db.query(
        'INSERT INTO users (id, fullName, email, department, role, phoneNumber, idNumber, password) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [id, fullName, email, department, role, phoneNumber, idNumber, hashedPassword]
      );
      console.log(`[AUTH] User registered successfully: ${email}`);

      // Verify user exists before inserting leave balances
      let userExists = false;
      let attempts = 0;
      while (!userExists && attempts < 5) {
        const [userResult] = await db.query('SELECT id FROM users WHERE id = ?', [id]);
        if ((userResult as any[]).length > 0) {
          userExists = true;
          break;
        }
        attempts++;
        if (attempts < 5) {
          await new Promise(resolve => setTimeout(resolve, 50));
        }
      }

      if (!userExists) {
        console.error(`[AUTH] User verification failed for userId: ${id}`);
        return sendError(res, 500, 'User registration verification failed. Please try again.', 'VERIFICATION_FAILED');
      }

      // Create leave balances
      const categories = ['Annual Leave', 'Sick Leave', 'Maternity Leave', 'Paternity Leave', 'Emergency Leave'];
      for (const cat of categories) {
        try {
          await db.query(
            'INSERT INTO leave_balances (userId, category, balance) VALUES (?, ?, ?)',
            [id, cat, cat === 'Annual Leave' ? 21 : 15]
          );
        } catch (balanceError: any) {
          console.error(`[AUTH] Failed to insert leave balance for ${id} (${cat}):`, balanceError.message);
        }
      }

      res.json({ success: true, message: 'Registration successful! You can now login with your credentials.' });
    } catch (error) {
      const { message, code, status } = handleDbError(error, 'User registration');
      sendError(res, status, message, code);
    }
  });

  app.post('/api/auth/reset-password', async (req, res) => {
    const { email, newPassword } = req.body;

    // Validation
    if (!email || !newPassword) {
      return sendError(res, 400, 'Email and new password are required.', 'MISSING_FIELD');
    }

    if (newPassword.length < 6) {
      return sendError(res, 400, 'Password must be at least 6 characters long.', 'WEAK_PASSWORD');
    }

    try {
      const [userRows] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
      const user = (userRows as any[])[0];
      if (!user) {
        return sendError(res, 404, 'No account found with this email address. Please check and try again.', 'USER_NOT_FOUND');
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await db.query('UPDATE users SET password = ? WHERE email = ?', [hashedPassword, email]);
      
      console.log(`[SECURITY] Password reset successful for: ${email}`);
      res.json({ success: true, message: 'Password has been reset successfully. You can now login with your new password.' });
    } catch (error) {
      const { message, code, status } = handleDbError(error, 'Password reset');
      sendError(res, status, message, code);
    }
  });

  // --- PROTECTED ROUTES BELOW ---
  app.use('/api/users', authenticateToken);
  app.use('/api/leaves', authenticateToken);
  app.use('/api/encashments', authenticateToken);
  app.use('/api/balances', authenticateToken);
  app.use('/api/departments', authenticateToken);
  app.use('/api/holidays', authenticateToken);
  app.use('/api/reports', authenticateToken);

  // Users
  app.get('/api/users', async (req, res) => {
    try {
      const [rows] = await db.query('SELECT id, fullName, email, department, role, phoneNumber, idNumber, avatar FROM users');
      res.json({ success: true, data: rows });
    } catch (error) {
      const { message, code, status } = handleDbError(error, 'Fetch users');
      sendError(res, status, message, code);
    }
  });

  app.put('/api/users/:id', async (req, res) => {
    const { id } = req.params;
    const { fullName, email, department, role, phoneNumber, idNumber, avatar } = req.body;

    // Validation
    if (!fullName || !email) {
      return sendError(res, 400, 'Full name and email are required.', 'MISSING_FIELD');
    }

    try {
      const result = await db.query(
        'UPDATE users SET fullName = ?, email = ?, department = ?, role = ?, phoneNumber = ?, idNumber = ?, avatar = ? WHERE id = ?',
        [fullName, email, department, role, phoneNumber, idNumber, avatar, id]
      );

      if ((result as any)[0]?.affectedRows === 0) {
        return sendError(res, 404, 'User not found. Please check the user ID and try again.', 'USER_NOT_FOUND');
      }

      console.log(`[AUDIT] User updated: ${id}`);
      res.json({ success: true, message: 'Profile updated successfully.' });
    } catch (error) {
      const { message, code, status } = handleDbError(error, 'Update user');
      sendError(res, status, message, code);
    }
  });

  app.delete('/api/users/:id', async (req, res) => {
    const { id } = req.params;

    try {
      const result = await db.query('DELETE FROM users WHERE id = ?', [id]);

      if ((result as any)[0]?.affectedRows === 0) {
        return sendError(res, 404, 'User not found. Please check the user ID and try again.', 'USER_NOT_FOUND');
      }

      console.log(`[AUDIT] User deleted: ${id}`);
      res.json({ success: true, message: 'User deleted successfully.' });
    } catch (error) {
      const { message, code, status } = handleDbError(error, 'Delete user');
      sendError(res, status, message, code);
    }
  });

  // Leave Balances
  app.get('/api/balances/:userId', async (req, res) => {
    const { userId } = req.params;

    try {
      const [rows] = await db.query('SELECT * FROM leave_balances WHERE userId = ?', [userId]);
      
      if (!rows || (rows as any[]).length === 0) {
        return sendError(res, 404, 'No leave balances found for this user. Please contact HR.', 'NO_BALANCES');
      }

      res.json({ success: true, data: rows });
    } catch (error) {
      const { message, code, status } = handleDbError(error, 'Fetch leave balances');
      sendError(res, status, message, code);
    }
  });

  // Leave Requests
  app.get('/api/leaves', async (req, res) => {
    try {
      const [rows] = await db.query('SELECT * FROM leave_requests ORDER BY appliedDate DESC');
      res.json({ success: true, data: rows });
    } catch (error) {
      const { message, code, status } = handleDbError(error, 'Fetch leave requests');
      sendError(res, status, message, code);
    }
  });

  app.post('/api/leaves', async (req, res) => {
    const { id, userId, fullName, category, startDate, endDate, reason, status, appliedDate } = req.body;

    // Validation
    if (!userId || !category || !startDate || !endDate) {
      return sendError(res, 400, 'All required fields must be completed.', 'MISSING_FIELD');
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (start > end) {
      return sendError(res, 400, 'Start date must be before end date.', 'INVALID_DATE_RANGE');
    }

    try {
      console.log(`[LEAVE] Creating leave request for: ${fullName}`);
      await db.query(
        'INSERT INTO leave_requests (id, userId, fullName, category, startDate, endDate, reason, status, appliedDate) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [id, userId, fullName, category, startDate, endDate, reason, status || 'Pending', appliedDate || new Date().toISOString()]
      );
      console.log(`[LEAVE] Leave request created: ${id}`);

      // If HR assigned it (already approved), deduct balance immediately
      if (status === 'Approved') {
        const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        
        await db.query(
          'UPDATE leave_balances SET balance = balance - ? WHERE userId = ? AND category = ?',
          [days, userId, category]
        );
      }

      res.json({ success: true, message: 'Leave request submitted successfully.' });
    } catch (error) {
      const { message, code, status } = handleDbError(error, 'Create leave request');
      sendError(res, status, message, code);
    }
  });

  app.patch('/api/leaves/:id', async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    // Validation
    if (!status || !['Pending', 'Approved', 'Rejected'].includes(status)) {
      return sendError(res, 400, 'Valid status (Pending, Approved, or Rejected) is required.', 'INVALID_STATUS');
    }

    try {
      const [leaveRows] = await db.query('SELECT * FROM leave_requests WHERE id = ?', [id]);
      const leave = (leaveRows as any[])[0];
      if (!leave) {
        return sendError(res, 404, 'Leave request not found. Please check the request ID.', 'LEAVE_NOT_FOUND');
      }

      await db.query('UPDATE leave_requests SET status = ? WHERE id = ?', [status, id]);

      // Fetch user email for notification
      const [userRows] = await db.query('SELECT email, fullName FROM users WHERE id = ?', [leave.userId]);
      const user = (userRows as any[])[0];
      if (user) {
        sendLeaveStatusNotification(user.email, user.fullName, leave.category, status).catch(err => console.error('[EMAIL] Notification error:', err));
      }

      // If approved, deduct from balance
      if (status === 'Approved') {
        const start = new Date(leave.startDate);
        const end = new Date(leave.endDate);
        const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

        await db.query(
          'UPDATE leave_balances SET balance = balance - ? WHERE userId = ? AND category = ?',
          [days, leave.userId, leave.category]
        );
      }

      console.log(`[LEAVE] Leave request ${id} status updated to: ${status}`);
      res.json({ success: true, message: `Leave request has been ${status.toLowerCase()}.` });
    } catch (error) {
      const { message, code, status } = handleDbError(error, 'Update leave request');
      sendError(res, status, message, code);
    }
  });

  // Encashment Requests
  app.get('/api/encashments', async (req, res) => {
    try {
      const [rows] = await db.query('SELECT * FROM encashment_requests ORDER BY appliedDate DESC');
      res.json({ success: true, data: rows });
    } catch (error) {
      const { message, code, status } = handleDbError(error, 'Fetch encashments');
      sendError(res, status, message, code);
    }
  });

  app.post('/api/encashments', async (req, res) => {
    const { id, userId, fullName, daysToSell, reason, status, appliedDate } = req.body;

    // Validation
    if (!userId || !daysToSell || daysToSell <= 0) {
      return sendError(res, 400, 'Valid number of days must be provided.', 'INVALID_DAYS');
    }

    if (daysToSell > 365) {
      return sendError(res, 400, 'Cannot encash more than 365 days at once.', 'DAYS_EXCEEDED');
    }

    try {
      await db.query(
        'INSERT INTO encashment_requests (id, userId, fullName, daysToSell, reason, status, appliedDate) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [id, userId, fullName, daysToSell, reason, status || 'Pending', appliedDate || new Date().toISOString()]
      );
      console.log(`[ENCASHMENT] Encashment request created: ${id}`);
      res.json({ success: true, message: 'Encashment request submitted successfully.' });
    } catch (error) {
      const { message, code, status } = handleDbError(error, 'Create encashment');
      sendError(res, status, message, code);
    }
  });

  app.patch('/api/encashments/:id', async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    // Validation
    if (!status || !['Pending', 'Approved', 'Rejected'].includes(status)) {
      return sendError(res, 400, 'Valid status (Pending, Approved, or Rejected) is required.', 'INVALID_STATUS');
    }

    try {
      const [encRows] = await db.query('SELECT * FROM encashment_requests WHERE id = ?', [id]);
      const enc = (encRows as any[])[0];
      if (!enc) {
        return sendError(res, 404, 'Encashment request not found. Please check the request ID.', 'ENCASHMENT_NOT_FOUND');
      }

      await db.query('UPDATE encashment_requests SET status = ? WHERE id = ?', [status, id]);

      // Fetch user email for notification
      const [userRows] = await db.query('SELECT email, fullName FROM users WHERE id = ?', [enc.userId]);
      const user = (userRows as any[])[0];
      if (user) {
        sendLeaveStatusNotification(user.email, user.fullName, 'Leave Encashment', status).catch(err => console.error('[EMAIL] Notification error:', err));
      }

      // If approved, deduct from Annual Leave balance
      if (status === 'Approved') {
        await db.query(
          'UPDATE leave_balances SET balance = balance - ? WHERE userId = ? AND category = ?',
          [enc.daysToSell, enc.userId, 'Annual Leave']
        );
      }

      console.log(`[ENCASHMENT] Encashment request ${id} status updated to: ${status}`);
      res.json({ success: true, message: `Encashment request has been ${status.toLowerCase()}.` });
    } catch (error) {
      const { message, code, status } = handleDbError(error, 'Update encashment');
      sendError(res, status, message, code);
    }
  });

  // Pension Requests
  app.use('/api/pensions', authenticateToken);

  app.get('/api/pensions', async (req, res) => {
    try {
      const [rows] = await db.query('SELECT * FROM pension_requests ORDER BY appliedDate DESC');
      res.json({ success: true, data: rows });
    } catch (error) {
      const { message, code, status } = handleDbError(error, 'Fetch pension requests');
      sendError(res, status, message, code);
    }
  });

  app.post('/api/pensions', async (req, res) => {
    const { id, userId, fullName, email, department, phoneNumber, dateOfBirth, retirementCategory, reason, status, appliedDate, supportingDoc } = req.body;

    // Validation
    if (!userId || !fullName || !email || !dateOfBirth || !retirementCategory || !reason) {
      return sendError(res, 400, 'All required fields must be completed.', 'MISSING_FIELD');
    }

    // Validate date of birth
    const dob = new Date(dateOfBirth);
    const today = new Date();
    const age = today.getFullYear() - dob.getFullYear();
    
    if (dob > today) {
      return sendError(res, 400, 'Date of birth cannot be in the future.', 'INVALID_DATE');
    }

    if (age < 18) {
      return sendError(res, 400, 'Employee must be at least 18 years old.', 'INVALID_AGE');
    }

    try {
      console.log(`[PENSION] Creating pension request for: ${fullName}`);
      await db.query(
        'INSERT INTO pension_requests (id, userId, fullName, email, department, phoneNumber, dateOfBirth, retirementCategory, reason, status, appliedDate, supportingDoc) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [id, userId, fullName, email, department, phoneNumber, dateOfBirth, retirementCategory, reason, status || 'Pending', appliedDate || new Date().toISOString(), supportingDoc || null]
      );
      console.log(`[PENSION] Pension request created: ${id}`);
      res.json({ success: true, message: 'Pension request submitted successfully.' });
    } catch (error) {
      const { message, code, status: errorStatus } = handleDbError(error, 'Create pension request');
      sendError(res, errorStatus, message, code);
    }
  });

  app.patch('/api/pensions/:id', async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    // Validation
    if (!status || !['Pending', 'Approved', 'Rejected'].includes(status)) {
      return sendError(res, 400, 'Valid status (Pending, Approved, or Rejected) is required.', 'INVALID_STATUS');
    }

    try {
      const [penRows] = await db.query('SELECT * FROM pension_requests WHERE id = ?', [id]);
      const pen = (penRows as any[])[0];
      if (!pen) {
        return sendError(res, 404, 'Pension request not found. Please check the request ID.', 'PENSION_NOT_FOUND');
      }

      await db.query('UPDATE pension_requests SET status = ? WHERE id = ?', [status, id]);

      // Fetch user email for notification
      const [userRows] = await db.query('SELECT email, fullName FROM users WHERE id = ?', [pen.userId]);
      const user = (userRows as any[])[0];
      if (user) {
        sendLeaveStatusNotification(user.email, user.fullName, 'Pension Request', status).catch(err => console.error('[EMAIL] Notification error:', err));
      }

      console.log(`[PENSION] Pension request ${id} status updated to: ${status}`);
      res.json({ success: true, message: `Pension request has been ${status.toLowerCase()}.` });
    } catch (error) {
      const { message, code, status } = handleDbError(error, 'Update pension request');
      sendError(res, status, message, code);
    }
  });

  // Reporting
  app.get('/api/reports/summary', async (req, res) => {
    try {
      const [totalLeavesRows] = await db.query('SELECT COUNT(*) as count FROM leave_requests');
      const totalLeaves = (totalLeavesRows as any[])[0];
      const [approvedLeavesRows] = await db.query('SELECT COUNT(*) as count FROM leave_requests WHERE status = "Approved"');
      const approvedLeaves = (approvedLeavesRows as any[])[0];
      const [pendingLeavesRows] = await db.query('SELECT COUNT(*) as count FROM leave_requests WHERE status = "Pending"');
      const pendingLeaves = (pendingLeavesRows as any[])[0];
      const [totalUsersRows] = await db.query('SELECT COUNT(*) as count FROM users');
      const totalUsers = (totalUsersRows as any[])[0];
      
      const [deptSummary] = await db.query(`
        SELECT department, COUNT(*) as count 
        FROM users 
        GROUP BY department
      `);

      res.json({
        success: true,
        stats: {
          totalLeaves: totalLeaves.count,
          approvedLeaves: approvedLeaves.count,
          pendingLeaves: pendingLeaves.count,
          totalEmployees: totalUsers.count
        },
        departments: deptSummary
      });
    } catch (error) {
      const { message, code, status } = handleDbError(error, 'Generate report summary');
      sendError(res, status, message, code);
    }
  });

  // Notifications
  app.get('/api/notifications/:userId', async (req, res) => {
    const { userId } = req.params;
    try {
      const [rows] = await db.query('SELECT * FROM notifications WHERE userId = ? ORDER BY created_at DESC', [userId]);
      res.json({ success: true, data: rows });
    } catch (error) {
      const { message, code, status } = handleDbError(error, 'Fetch notifications');
      sendError(res, status, message, code);
    }
  });

  app.post('/api/notifications', async (req, res) => {
    const { id, userId, title, description, type } = req.body;

    // Validation
    if (!userId || !title || !description) {
      return sendError(res, 400, 'User ID, title, and description are required.', 'MISSING_FIELD');
    }

    try {
      await db.query(
        'INSERT INTO notifications (id, userId, title, description, type) VALUES (?, ?, ?, ?, ?)',
        [id, userId, title, description, type || 'info']
      );
      console.log(`[NOTIFY] Notification created for user: ${userId}`);
      res.json({ success: true, message: 'Notification created successfully.' });
    } catch (error) {
      const { message, code, status } = handleDbError(error, 'Create notification');
      sendError(res, status, message, code);
    }
  });

  app.patch('/api/notifications/read-all/:userId', async (req, res) => {
    const { userId } = req.params;
    try {
      const result = await db.query('UPDATE notifications SET is_read = 1 WHERE userId = ?', [userId]);
      console.log(`[NOTIFY] Marked all notifications as read for user: ${userId}`);
      res.json({ success: true, message: 'All notifications marked as read.' });
    } catch (error) {
      const { message, code, status } = handleDbError(error, 'Mark notifications as read');
      sendError(res, status, message, code);
    }
  });

  // Departments
  app.get('/api/departments', async (req, res) => {
    try {
      const [rows] = await db.query('SELECT * FROM departments');
      res.json({ success: true, data: rows });
    } catch (error) {
      const { message, code, status } = handleDbError(error, 'Fetch departments');
      sendError(res, status, message, code);
    }
  });

  app.post('/api/departments', async (req, res) => {
    const { id, name, head, status } = req.body;

    // Validation
    if (!name || !head) {
      return sendError(res, 400, 'Department name and head are required.', 'MISSING_FIELD');
    }

    try {
      // Check if the person is already leading another department
      const [existingDepts] = await db.query('SELECT id, name FROM departments WHERE head = ?', [head]);
      if ((existingDepts as any[]).length > 0) {
        const otherDept = (existingDepts as any[])[0];
        return sendError(res, 409, `Validation failed: ${head} is already leading the "${otherDept.name}" department. Each person can only lead one department.`, 'DUPLICATE_DEPARTMENT_HEAD');
      }

      await db.query(
        'INSERT INTO departments (id, name, head, status) VALUES (?, ?, ?, ?)',
        [id, name, head, status || 'Active']
      );
      console.log(`[DEPT] Department created: ${name}`);
      res.json({ success: true, message: 'Department created successfully.' });
    } catch (error) {
      const { message, code, status } = handleDbError(error, 'Create department');
      sendError(res, status, message, code);
    }
  });

  app.put('/api/departments/:id', async (req, res) => {
    const { id } = req.params;
    const { name, head, status } = req.body;

    // Validation
    if (!name || !head) {
      return sendError(res, 400, 'Department name and head are required.', 'MISSING_FIELD');
    }

    try {
      // Get the current department to check if head is being changed
      const [currentDepts] = await db.query('SELECT head FROM departments WHERE id = ?', [id]);
      const currentDept = (currentDepts as any[])[0];

      if (!currentDept) {
        return sendError(res, 404, 'Department not found.', 'DEPARTMENT_NOT_FOUND');
      }

      // Only check for duplicate if the head is being changed
      if (head !== currentDept.head) {
        const [existingDepts] = await db.query('SELECT id, name FROM departments WHERE head = ? AND id != ?', [head, id]);
        if ((existingDepts as any[]).length > 0) {
          const otherDept = (existingDepts as any[])[0];
          return sendError(res, 409, `Validation failed: ${head} is already leading the "${otherDept.name}" department. Each person can only lead one department.`, 'DUPLICATE_DEPARTMENT_HEAD');
        }
      }

      await db.query('UPDATE departments SET name = ?, head = ?, status = ? WHERE id = ?', [name, head, status, id]);
      console.log(`[DEPT] Department updated: ${name}`);
      res.json({ success: true, message: 'Department updated successfully.' });
    } catch (error) {
      const { message, code, status } = handleDbError(error, 'Update department');
      sendError(res, status, message, code);
    }
  });

  app.delete('/api/departments/:id', async (req, res) => {
    const { id } = req.params;
    try {
      const result = await db.query('DELETE FROM departments WHERE id = ?', [id]);

      if ((result as any)[0]?.affectedRows === 0) {
        return sendError(res, 404, 'Department not found. Please check the department ID.', 'DEPARTMENT_NOT_FOUND');
      }

      console.log(`[DEPT] Department deleted: ${id}`);
      res.json({ success: true, message: 'Department deleted successfully.' });
    } catch (error) {
      const { message, code, status } = handleDbError(error, 'Delete department');
      sendError(res, status, message, code);
    }
  });

  // Holidays
  app.get('/api/holidays', async (req, res) => {
    try {
      const [rows] = await db.query('SELECT * FROM holidays ORDER BY date ASC');
      res.json({ success: true, data: rows });
    } catch (error) {
      const { message, code, status } = handleDbError(error, 'Fetch holidays');
      sendError(res, status, message, code);
    }
  });

  app.post('/api/holidays', async (req, res) => {
    const { id, name, date, type } = req.body;

    // Validation
    if (!name || !date) {
      return sendError(res, 400, 'Holiday name and date are required.', 'MISSING_FIELD');
    }

    // Validate date format
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) {
      return sendError(res, 400, 'Invalid date format. Please use YYYY-MM-DD.', 'INVALID_DATE');
    }

    try {
      await db.query(
        'INSERT INTO holidays (id, name, date, type) VALUES (?, ?, ?, ?)',
        [id || Math.random().toString(36).substr(2, 9), name, date, type || 'Public']
      );
      console.log(`[HOLIDAY] Holiday created: ${name} on ${date}`);
      res.json({ success: true, message: 'Holiday created successfully.' });
    } catch (error) {
      const { message, code, status } = handleDbError(error, 'Create holiday');
      sendError(res, status, message, code);
    }
  });

  app.delete('/api/holidays/:id', async (req, res) => {
    const { id } = req.params;
    try {
      const result = await db.query('DELETE FROM holidays WHERE id = ?', [id]);

      if ((result as any)[0]?.affectedRows === 0) {
        return sendError(res, 404, 'Holiday not found. Please check the holiday ID.', 'HOLIDAY_NOT_FOUND');
      }

      console.log(`[HOLIDAY] Holiday deleted: ${id}`);
      res.json({ success: true, message: 'Holiday deleted successfully.' });
    } catch (error) {
      const { message, code, status } = handleDbError(error, 'Delete holiday');
      sendError(res, status, message, code);
    }
  });

  // --- VITE MIDDLEWARE ---
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files in production
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`
🚀 SmartLeave Full-Stack Server Running (MySQL)
--------------------------------------
Local: http://localhost:${PORT}
API:   http://localhost:${PORT}/api
    `);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
