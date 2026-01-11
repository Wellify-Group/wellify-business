/**
 * Express.js Backend Server для Wellify Business
 * Заменяет Supabase Auth и Database API
 * 
 * Деплой: Render.com
 * База данных: PostgreSQL (Render)
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { logger } from './utils/logger.js';
import { db } from './db/connection.js';

// Routes
import healthRoutes from './routes/health.js';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import profileRoutes from './routes/profiles.js';
import emailRoutes from './routes/email.js';
import emailVerificationRoutes from './routes/email-verification.js';
import smsRoutes from './routes/sms.js';
import businessesRoutes from './routes/businesses.js';
import subscriptionsRoutes from './routes/subscriptions.js';
import locationsRoutes from './routes/locations.js';
import stripeRoutes from './routes/stripe.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
// Поддержка нескольких origins для CORS
const allowedOrigins = process.env.CORS_ORIGINS 
  ? process.env.CORS_ORIGINS.split(',').map(origin => origin.trim())
  : [
      process.env.FRONTEND_URL || 'https://wellify-business.pages.dev',
      'https://business.wellifyglobal.com',
      'https://wellify-business.vercel.app',
    ];

app.use(cors({
  origin: (origin, callback) => {
    // Разрешаем запросы без origin (например, Postman, mobile apps)
    if (!origin) return callback(null, true);
    
    // Проверяем если origin в списке разрешенных
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    // В development разрешаем любые origins
    if (process.env.NODE_ENV === 'development') {
      return callback(null, true);
    }
    
    // Иначе отклоняем
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check routes (должны быть первыми)
app.use('/api/health', healthRoutes);

// Legacy health endpoint (для обратной совместимости)
app.get('/health', async (req, res) => {
  try {
    await db.query('SELECT 1');
    res.json({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      database: 'connected'
    });
  } catch (error) {
    logger.error('Health check failed', error);
    res.status(500).json({ 
      status: 'error', 
      database: 'disconnected',
      error: error.message 
    });
  }
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/profiles', profileRoutes);
app.use('/api/email', emailRoutes);
app.use('/api/email-verification', emailVerificationRoutes);
app.use('/api/sms', smsRoutes);
app.use('/api/businesses', businessesRoutes);
app.use('/api/subscriptions', subscriptionsRoutes);
app.use('/api/locations', locationsRoutes);
app.use('/api/stripe', stripeRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  logger.error('Unhandled error', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start server
app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

