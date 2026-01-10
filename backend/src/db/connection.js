/**
 * Database Connection Pool
 * Поддерживает PostgreSQL (Render) и Cloudflare D1
 * 
 * Использование:
 * - PostgreSQL: установи DATABASE_URL
 * - D1: установи CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_D1_DATABASE_ID, CLOUDFLARE_API_TOKEN
 * 
 * Переключение через DATABASE_TYPE=postgres|d1 (по умолчанию postgres)
 */

import pg from 'pg';
import { logger } from '../utils/logger.js';
import { createD1Adapter, testD1Connection } from './d1-adapter.js';

const { Pool } = pg;

const DATABASE_TYPE = process.env.DATABASE_TYPE || 'postgres';

let db;

if (DATABASE_TYPE === 'd1') {
  // Используем Cloudflare D1
  logger.info('Initializing Cloudflare D1 connection...');
  
  try {
    db = createD1Adapter();
    
    // Тестовое подключение
    testD1Connection(db).then(success => {
      if (success) {
        logger.info('D1 database connected successfully');
      } else {
        logger.error('D1 database connection failed');
        process.exit(1);
      }
    });
  } catch (error) {
    logger.error('Failed to initialize D1 adapter', error);
    process.exit(1);
  }
} else {
  // Используем PostgreSQL (по умолчанию)
  logger.info('Initializing PostgreSQL connection...');
  
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    logger.error('DATABASE_URL is not set');
    process.exit(1);
  }

  // Создаём connection pool
  db = new Pool({
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
}

export { db };


