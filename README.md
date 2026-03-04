# SmartLeave - Advanced Leave Management System

A comprehensive, full-stack leave management system built with modern web technologies. Streamline your organization's leave requests, approvals, and tracking with an intuitive and efficient interface.

## 📋 Features

- **User Authentication**: Secure login and registration system
- **Leave Management**: Request, approve, and track leave applications
- **Employee Dashboard**: Personal dashboard with leave history and statistics
- **Admin Dashboard**: Comprehensive admin panel for managing employees and leave policies
- **Holiday Management**: Configure and manage company holidays
- **Notification System**: Real-time notifications for leave requests and approvals
- **System Logs**: Track all system activities and changes
- **Department Management**: Organize employees by departments
- **Email Notifications**: Automated email alerts for leave updates
- **Profile Management**: Employee profile management and settings
- **Responsive Design**: Works seamlessly on desktop and mobile devices

## 🛠️ Tech Stack

### Frontend
- **React 18** - UI library
- **TypeScript** - Type-safe JavaScript
- **Vite** - Next-generation build tool
- **Tailwind CSS** - Utility-first CSS framework

### Backend
- **Node.ts** - TypeScript runtime for backend
- **Express.js** - Web framework (via Node.ts)

### Database
- **MySQL/PHP** - Backend database and server-side logic

### Tools & Libraries
- **React Router** - Client-side routing
- **Axios** - HTTP client for API calls
- **ESBuild** - JavaScript bundler

## 📋 Prerequisites

- **Node.js** (v16 or higher)
- **npm** or **yarn** package manager
- **MySQL** database server
- **PHP** (v7.4 or higher) for backend

## 🚀 Installation & Setup

### 1. Clone the Repository
```bash
git clone https://github.com/MunyaruyongaAngePrince/SmartLeave.git
cd SmartLeave
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Create a `.env` file in the root directory:
```env
VITE_API_URL=http://localhost:3000
VITE_APP_NAME=SmartLeave
```

### 4. Set Up Database
1. Create a MySQL database
2. Run the schema:
   ```bash
   mysql -u your_user -p your_database < schema.sql
   ```
3. Update database credentials in `db_connect.php`

### 5. Configure PHP Backend
- Configure your web server to serve `db_connect.php` and other backend endpoints

## 🏃 Running the Application

### Development Mode
```bash
npm run dev
```
The application will be available at `http://localhost:5173`

### Build Production
```bash
npm run build
```

### Preview Production Build
```bash
npm run preview
```

## 📁 Project Structure

```
smartleave/
├── components/          # Reusable React components
├── pages/              # Page components
├── services/           # API and business logic services
├── src/               # Source code
├── db_connect.php     # Database connection
├── schema.sql         # Database schema
├── App.tsx            # Main App component
├── index.tsx          # Entry point
├── types.ts           # TypeScript type definitions
├── constants.tsx      # App constants
├── vite.config.ts     # Vite configuration
└── tsconfig.json      # TypeScript configuration
```

## 🔑 Key Components

- **AdminDashboard** - Admin interface for system management
- **EmployeeDashboard** - Employee workspace and leave management
- **ApplyLeave** - Leave request submission form
- **LeaveHistory** - Historical leave records and status
- **Departments** - Department management interface
- **Employees** - Employee management interface
- **Notifications** - Real-time notification center
- **Profile** - User profile management

## 🔐 Security Features

- Secure authentication and authorization
- Protected API endpoints
- SQL injection prevention
- XSS protection
- CSRF tokens

## 📧 Email Notifications

The system includes automated email notifications for:
- Leave request submissions
- Leave approvals/rejections
- Leave cancellations
- System alerts

Configure your email service in `emailService.ts`

## 🐛 Troubleshooting

### Database Connection Issues
- Verify MySQL is running
- Check credentials in `db_connect.php`
- Ensure database is created with schema

### Port Already in Use
- Change the dev port in `vite.config.ts`
- Or kill the process using the port

### Module Not Found
- Run `npm install` again
- Clear node_modules and reinstall: `rm -rf node_modules && npm install`

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👨‍💻 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📞 Support

For issues and questions, please open an issue on GitHub.

---

**Happy Leave Managing! 🎉**
