import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

let dbInstance: any = null;
let dbEngine: 'MySQL' = 'MySQL';

export async function getDb() {
  if (dbInstance) return dbInstance;

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'smartleave',
    multipleStatements: true
  });
  console.log('[DB] Connected to MySQL');
  dbInstance = connection;
  dbEngine = 'MySQL';
  return dbInstance;
}

export function getEngine() {
  return dbEngine;
}

export async function initDb() {
  const db = await getDb();

  try {
    console.log('[DB] Initializing MySQL schema...');
    // MySQL schema initialization
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT || '3306'),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      multipleStatements: true
    });
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME || 'smartleave'}\``);
    await connection.end();

    // Common Schema (compatible with both)
    const schema = `
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(50) PRIMARY KEY,
        fullName VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        department VARCHAR(100) NOT NULL,
        role VARCHAR(50) NOT NULL,
        phoneNumber VARCHAR(20),
        idNumber VARCHAR(50),
        avatar TEXT,
        password VARCHAR(255) NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS departments (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        head VARCHAR(255),
        status VARCHAR(50) DEFAULT 'Active'
      );

      CREATE TABLE IF NOT EXISTS leave_requests (
        id VARCHAR(50) PRIMARY KEY,
        userId VARCHAR(50) NOT NULL,
        fullName VARCHAR(255) NOT NULL,
        category VARCHAR(100) NOT NULL,
        startDate DATE NOT NULL,
        endDate DATE NOT NULL,
        reason TEXT,
        status VARCHAR(50) DEFAULT 'Pending',
        appliedDate DATETIME DEFAULT CURRENT_TIMESTAMP,
        supportingDoc TEXT
      );

      CREATE TABLE IF NOT EXISTS encashment_requests (
        id VARCHAR(50) PRIMARY KEY,
        userId VARCHAR(50) NOT NULL,
        fullName VARCHAR(255) NOT NULL,
        daysToSell INT NOT NULL,
        status VARCHAR(50) DEFAULT 'Pending',
        reason TEXT,
        appliedDate DATETIME DEFAULT CURRENT_TIMESTAMP,
        supportingDoc TEXT
      );

      CREATE TABLE IF NOT EXISTS notifications (
        id VARCHAR(50) PRIMARY KEY,
        userId VARCHAR(50) NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        type VARCHAR(50) DEFAULT 'info',
        is_read TINYINT DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS holidays (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        date DATE NOT NULL,
        type VARCHAR(50) DEFAULT 'Public'
      );

      CREATE TABLE IF NOT EXISTS leave_balances (
        userId VARCHAR(50) NOT NULL,
        category VARCHAR(100) NOT NULL,
        balance DOUBLE DEFAULT 21,
        PRIMARY KEY (userId, category),
        FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
      );
    `;

    // Execute schema
    await db.query(schema);

    const hashedPassword = await bcrypt.hash('password123', 10);

    // Initial Data
    const ignoreKeyword = 'IGNORE';
    
    await db.query(`INSERT ${ignoreKeyword} INTO users (id, fullName, email, department, role, password) VALUES 
      ('u1', 'John Doe', 'john@company.com', 'Engineering', 'Employee', ?),
      ('u2', 'Jane Smith', 'jane@company.com', 'Human Resources', 'HR Manager', ?)
    `, [hashedPassword, hashedPassword]);

    await db.query(`INSERT ${ignoreKeyword} INTO leave_balances (userId, category, balance) VALUES 
      ('u1', 'Annual Leave', 21),
      ('u1', 'Sick Leave', 15),
      ('u2', 'Annual Leave', 21),
      ('u2', 'Sick Leave', 15)
    `);

    await db.query(`INSERT ${ignoreKeyword} INTO departments (id, name, head, status) VALUES 
      ('d1', 'Engineering', 'Robert Wilson', 'Active'),
      ('d2', 'Marketing', 'Sarah Jenkins', 'Active'),
      ('d3', 'Human Resources', 'Jane Smith', 'Active')
    `);

    await db.query(`INSERT ${ignoreKeyword} INTO holidays (id, name, date, type) VALUES 
      ('h1', 'New Year Day', '2026-01-01', 'Public'),
      ('h2', 'New Year Holiday', '2026-01-02', 'Public'),
      ('h3', 'National Heroes Day', '2026-02-01', 'Public'),
      ('h4', 'Eid al-Fitr', '2026-03-20', 'Public'),
      ('h5', 'Good Friday', '2026-04-03', 'Public'),
      ('h6', 'Easter Monday', '2026-04-06', 'Public'),
      ('h7', 'Genocide Memorial Day', '2026-04-07', 'Public'),
      ('h8', 'Labor Day', '2026-05-01', 'Public'),
      ('h9', 'Eid al-Adha', '2026-05-27', 'Public'),
      ('h10', 'Independence Day', '2026-07-01', 'Public'),
      ('h11', 'Liberation Day', '2026-07-04', 'Public'),
      ('h12', 'Umuganura (Harvest Day)', '2026-08-07', 'Public'),
      ('h13', 'Assumption Day', '2026-08-15', 'Public'),
      ('h14', 'Christmas Day', '2026-12-25', 'Public'),
      ('h15', 'Boxing Day', '2026-12-26', 'Public')
    `);

    console.log('[DB] Database initialized successfully (MySQL)');
    return db;
  } catch (error) {
    console.error('[DB] Failed to initialize database:', error);
    throw error;
  }
}
