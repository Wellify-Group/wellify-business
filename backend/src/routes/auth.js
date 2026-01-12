/**
 * Auth Routes
 * Заменяет Supabase Auth API
 */

import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../db/connection.js';
import { logger } from '../utils/logger.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

/**
 * POST /api/auth/signup
 * Регистрация нового пользователя
 */
router.post('/signup', async (req, res) => {
  try {
    const { email, password, full_name, phone } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Проверяем, существует ли пользователь
    const existingUser = await db.query(
      'SELECT id FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Хешируем пароль
    const passwordHash = await bcrypt.hash(password, 10);

    // Создаём пользователя
    const userResult = await db.query(
      `INSERT INTO users (email, password_hash, phone, created_at)
       VALUES ($1, $2, $3, NOW())
       RETURNING id, email, email_verified, phone, phone_verified, created_at`,
      [email.toLowerCase(), passwordHash, phone || null]
    );

    const user = userResult.rows[0];

    // Создаём профиль
    await db.query(
      `INSERT INTO profiles (id, full_name, role, language, phone, phone_verified, email_verified)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [user.id, full_name || null, 'director', 'uk', phone || null, false, false]
    );

    // Генерируем JWT токен
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.status(201).json({
      user: {
        id: user.id,
        email: user.email,
        email_verified: user.email_verified,
        phone: user.phone,
        phone_verified: user.phone_verified,
      },
      token,
    });
  } catch (error) {
    logger.error('Signup error', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/auth/login
 * Вход пользователя
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Находим пользователя
    const userResult = await db.query(
      `SELECT u.id, u.email, u.password_hash, u.email_verified, u.phone, u.phone_verified,
              p.full_name, p.role, p.language
       FROM users u
       LEFT JOIN profiles p ON u.id = p.id
       WHERE u.email = $1`,
      [email.toLowerCase()]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userResult.rows[0];

    // Проверяем пароль
    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Обновляем last_sign_in_at
    await db.query(
      'UPDATE users SET last_sign_in_at = NOW() WHERE id = $1',
      [user.id]
    );

    // Генерируем JWT токен
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.json({
      user: {
        id: user.id,
        email: user.email,
        email_verified: user.email_verified,
        phone: user.phone,
        phone_verified: user.phone_verified,
        full_name: user.full_name,
        role: user.role,
        language: user.language,
      },
      token,
    });
  } catch (error) {
    logger.error('Login error', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/auth/user
 * Получить текущего пользователя (требует токен)
 */
router.get('/user', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Верифицируем токен
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Получаем пользователя
    const userResult = await db.query(
      `SELECT u.id, u.email, u.email_verified, u.phone, u.phone_verified, u.created_at,
              p.full_name, p.avatar_url, p.role, p.language
       FROM users u
       LEFT JOIN profiles p ON u.id = p.id
       WHERE u.id = $1`,
      [decoded.userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user: userResult.rows[0] });
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    }
    logger.error('Get user error', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/auth/check-email
 * Проверить, существует ли email
 */
router.post('/check-email', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const result = await db.query(
      'SELECT id, email, email_verified FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (result.rows.length === 0) {
      return res.json({ exists: false });
    }

    res.json({
      exists: true,
      email_verified: result.rows[0].email_verified,
    });
  } catch (error) {
    logger.error('Check email error', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/auth/forgot-password
 * Запросить сброс пароля
 */
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Находим пользователя
    const userResult = await db.query(
      'SELECT id, email FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (userResult.rows.length === 0) {
      // Не раскрываем, что пользователь не существует (безопасность)
      return res.json({ success: true, message: 'If email exists, reset link will be sent' });
    }

    const user = userResult.rows[0];

    // Генерируем токен для сброса пароля
    const resetToken = jwt.sign(
      { userId: user.id, email: user.email, type: 'password_reset' },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Сохраняем токен в БД
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 час
    await db.query(
      `INSERT INTO password_resets (user_id, email, token, expires_at)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (token) DO UPDATE SET expires_at = $4`,
      [user.id, user.email, resetToken, expiresAt]
    );

    // TODO: Отправить email с токеном через Resend
    // Пока возвращаем токен (в production нужно отправлять email)
    res.json({
      success: true,
      message: 'Password reset token generated',
      // В development можно вернуть токен для тестирования
      ...(process.env.NODE_ENV === 'development' && { token: resetToken }),
    });
  } catch (error) {
    logger.error('Forgot password error', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/auth/reset-password
 * Сбросить пароль по токену
 */
router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ error: 'Token and new password are required' });
    }

    // Проверяем токен
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
      if (decoded.type !== 'password_reset') {
        return res.status(400).json({ error: 'Invalid token type' });
      }
    } catch (error) {
      return res.status(400).json({ error: 'Invalid or expired token' });
    }

    // Проверяем токен в БД
    const resetResult = await db.query(
      `SELECT * FROM password_resets 
       WHERE token = $1 AND used_at IS NULL AND expires_at > NOW()`,
      [token]
    );

    if (resetResult.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    const resetRecord = resetResult.rows[0];

    // Хешируем новый пароль
    const passwordHash = await bcrypt.hash(newPassword, 10);

    // Обновляем пароль
    await db.query(
      'UPDATE users SET password_hash = $1 WHERE id = $2',
      [passwordHash, resetRecord.user_id]
    );

    // Помечаем токен как использованный
    await db.query(
      'UPDATE password_resets SET used_at = NOW() WHERE token = $1',
      [token]
    );

    res.json({ success: true, message: 'Password reset successfully' });
  } catch (error) {
    logger.error('Reset password error', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Генерация кода компании (16-значный код)
 */
function generateCompanyCode() {
  const part = () => Math.floor(1000 + Math.random() * 9000);
  return `${part()}-${part()}-${part()}-${part()}`;
}

/**
 * POST /api/auth/register-director
 * Регистрация директора с бизнесом
 */
router.post('/register-director', async (req, res) => {
  try {
    const {
      email,
      password,
      fullName,
      firstName,
      lastName,
      middleName,
      birthDate,
      language,
      businessName,
    } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        errorCode: 'VALIDATION_ERROR',
      });
    }

    const normalizedEmail = String(email).toLowerCase().trim();

    // Формируем имя директора
    const safeFirstName =
      (firstName && String(firstName).trim()) ||
      (fullName && String(fullName).trim().split(' ')[0]) ||
      'Директор';

    const safeLastName = (lastName && String(lastName).trim()) || null;
    const safeMiddleName = (middleName && String(middleName).trim()) || null;
    const safeFullName =
      (fullName && String(fullName).trim()) ||
      [safeFirstName, safeLastName].filter(Boolean).join(' ') ||
      'Директор';

    const safeLanguage = (language && String(language)) || 'ru';
    const safeBusinessName =
      (businessName && String(businessName).trim()) || 'Мой бизнес';

    // Генерируем код компании
    let companyCode = generateCompanyCode();
    let attempts = 0;
    while (attempts < 10) {
      const existing = await db.query(
        'SELECT id FROM businesses WHERE код_компании = $1',
        [companyCode]
      );
      if (existing.rows.length === 0) break;
      companyCode = generateCompanyCode();
      attempts++;
    }

    // Проверяем, существует ли пользователь
    const existingUser = await db.query(
      'SELECT id FROM users WHERE email = $1',
      [normalizedEmail]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        success: false,
        error: 'User with this email already exists',
        errorCode: 'EMAIL_ALREADY_REGISTERED',
      });
    }

    // Хешируем пароль
    const passwordHash = await bcrypt.hash(password, 10);

    // Генерируем код компании (внутри транзакции, чтобы избежать race condition)
    // Начинаем транзакцию PostgreSQL
    const client = await db.connect();
    try {
      await client.query('BEGIN');

      // Генерируем уникальный код компании
      let companyCode = generateCompanyCode();
      let attempts = 0;
      while (attempts < 10) {
        const existing = await client.query(
          'SELECT id FROM businesses WHERE код_компании = $1',
          [companyCode]
        );
        if (existing.rows.length === 0) break;
        companyCode = generateCompanyCode();
        attempts++;
      }

      // Создаём пользователя
      const userResult = await client.query(
        `INSERT INTO users (email, password_hash, created_at)
         VALUES ($1, $2, NOW())
         RETURNING id, email, email_verified, phone, phone_verified, created_at`,
        [normalizedEmail, passwordHash]
      );

      const user = userResult.rows[0];
      const userId = user.id;

      // Создаём профиль
      await client.query(
        `INSERT INTO profiles (id, full_name, role, language, phone_verified, email_verified)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [userId, safeFullName, 'director', safeLanguage, false, false]
      );

      // Создаём бизнес
      const businessResult = await client.query(
        `INSERT INTO businesses (owner_profile_id, название, код_компании)
         VALUES ($1, $2, $3)
         RETURNING id, название, код_компании`,
        [userId, safeBusinessName, companyCode]
      );

      const business = businessResult.rows[0];
      const businessId = business.id;

      // Создаём запись в staff для директора
      await client.query(
        `INSERT INTO staff (profile_id, business_id, роль, должность, активен)
         VALUES ($1, $2, $3, $4, $5)`,
        [userId, businessId, 'директор', 'владелец', true]
      );

      // Коммитим транзакцию
      await client.query('COMMIT');

      // Генерируем JWT токен
      const token = jwt.sign(
        { userId: user.id, email: user.email },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
      );

      return res.status(201).json({
        success: true,
        user: {
          id: userId,
          email: user.email,
          fullName: safeFullName,
          role: 'director',
        },
        business: {
          id: businessId,
          name: business.название,
          companyCode: business.код_компании,
        },
        companyCode: business.код_компании,
        token,
      });
    } catch (dbError) {
      // Откатываем транзакцию при ошибке
      try {
        await client.query('ROLLBACK');
      } catch (rollbackError) {
        logger.error('Failed to rollback transaction', rollbackError);
      }
      logger.error('Database error during director registration', {
        error: dbError.message,
        stack: dbError.stack,
        code: dbError.code,
        detail: dbError.detail,
      });
      
      return res.status(500).json({
        success: false,
        error: 'Failed to create user profile or business',
        errorCode: 'REGISTRATION_FAILED',
        details: process.env.NODE_ENV === 'development' ? dbError.message : undefined,
      });
    } finally {
      // Освобождаем клиента обратно в pool
      client.release();
    }
  } catch (error) {
    logger.error('Register director error', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      errorCode: 'INTERNAL_ERROR',
    });
  }
});

export default router;

