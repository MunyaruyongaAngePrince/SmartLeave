import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function testHolidays() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 1,
    queueLimit: 0
  });

  try {
    const connection = await pool.getConnection();
    
    // Check if is_annual column exists
    const [columns] = await connection.query('SHOW COLUMNS FROM holidays');
    console.log('\n=== HOLIDAYS TABLE COLUMNS ===');
    console.log(columns.map((c: any) => `${c.Field} (${c.Type})`));
    
    // Get all holidays
    const [holidays]: any = await connection.query('SELECT * FROM holidays ORDER BY date ASC LIMIT 10');
    console.log('\n=== HOLIDAYS DATA (first 10) ===');
    console.log(holidays);
    
    console.log(`\n=== TOTAL HOLIDAYS: ${holidays.length} ===`);
    
    // Check is_annual values
    const [annualCount]: any = await connection.query('SELECT COUNT(*) as count FROM holidays WHERE is_annual = TRUE');
    const [nonAnnualCount]: any = await connection.query('SELECT COUNT(*) as count FROM holidays WHERE is_annual = FALSE');
    console.log(`Annual holidays: ${annualCount[0].count}`);
    console.log(`Non-annual holidays: ${nonAnnualCount[0].count}`);
    
    connection.release();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

testHolidays();
