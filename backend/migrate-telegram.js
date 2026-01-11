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

async function runTelegramMigration() {
  try {
    console.log('🔄 Connecting to database...');
    
    const sqlPath = path.join(__dirname, 'src', 'db', 'telegram-migration.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('📝 Running telegram-migration.sql...');
    await pool.query(sql);
    
    console.log('✅ Telegram migration completed successfully!');
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Telegram migration failed:', error);
    console.error('Error details:', error.message);
    if (error.code) {
      console.error('PostgreSQL error code:', error.code);
    }
    await pool.end();
    process.exit(1);
  }
}

runTelegramMigration();
