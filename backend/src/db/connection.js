/**
 * PostgreSQL Connection Pool
 * Использует Render PostgreSQL
 */

import pg from 'pg';
import { logger } from '../utils/logger.js';

const { Pool } = pg;

// Получаем DATABASE_URL из переменных окружения Render
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  logger.error('DATABASE_URL is not set');
  process.exit(1);
}

// Создаём connection pool
export const db = new Pool({
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
    logger.info('Database connected successfully');
  })
  .catch((err) => {
    logger.error('Database connection failed', err);
    process.exit(1);
  });

