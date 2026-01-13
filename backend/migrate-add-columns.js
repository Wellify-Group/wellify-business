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

async function runMigration() {
  try {
    console.log('🔄 Connecting to database...');
    
    const sqlPath = path.join(__dirname, 'src', 'db', 'add-missing-columns.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('📝 Adding missing columns to users and profiles tables...');
    await pool.query(sql);
    
    console.log('✅ Migration completed successfully!');
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    console.error('Error details:', error.message);
    if (error.code) {
      console.error('PostgreSQL error code:', error.code);
    }
    await pool.end();
    process.exit(1);
  }
}

runMigration();
