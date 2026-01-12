import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Загружаем переменные окружения из .env файла
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function runFix() {
  try {
    console.log('🔄 Connecting to database...');
    
    const sqlPath = path.join(__dirname, 'src', 'db', 'fix-trigger.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('📝 Fixing handle_new_user trigger...');
    await pool.query(sql);
    
    console.log('✅ Trigger fixed successfully!');
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Fix failed:', error);
    await pool.end();
    process.exit(1);
  }
}

runFix();
