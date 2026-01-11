/**
 * Database Connection Pool
 * PostgreSQL (Render)
 * 
 * Использование:
 * - PostgreSQL: установи DATABASE_URL
 */

import pg from 'pg';
import { logger } from '../utils/logger.js';

const { Pool } = pg;

// Используем PostgreSQL
logger.info('Initializing PostgreSQL connection...');

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  logger.error('DATABASE_URL is not set');
  process.exit(1);
}

// Создаём connection pool
const db = new Pool({
  connectionString,
  ssl: process.env.NODE_ENV === 'production' ? {
    rejectUnauthorized: false
  } : false,
  max: 20, // Максимум соединений в pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Обработка ошибок подключения
db.on('error', (err) => {
  logger.error('Unexpected error on idle client', err);
  process.exit(-1);
});

// Тестовое подключение при старте
db.query('SELECT NOW()')
  .then(() => {
    logger.info('PostgreSQL database connected successfully');
  })
  .catch((err) => {
    logger.error('PostgreSQL database connection failed', err);
    process.exit(1);
  });

export { db };
