/**
 * Health Check Routes
 * 
 * GET /api/health/live - Liveness probe (проверка что сервер работает)
 * GET /api/health/ready - Readiness probe (проверка что сервер готов принимать трафик, включая БД)
 */

import express from 'express';
import { db } from '../db/connection.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

/**
 * GET /api/health/live
 * Liveness probe - проверяет что сервер работает
 * Не проверяет подключение к БД
 */
router.get('/live', (req, res) => {
  res.json({ 
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

/**
 * GET /api/health/ready
 * Readiness probe - проверяет что сервер готов принимать трафик
 * Проверяет подключение к БД
 */
router.get('/ready', async (req, res) => {
  try {
    // Проверяем подключение к БД
    await db.query('SELECT 1');
    res.json({ 
      ready: true,
      database: 'connected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Health check failed', error);
    res.status(503).json({ 
      ready: false,
      database: 'disconnected',
      error: error.message 
    });
  }
});

export default router;
