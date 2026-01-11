/**
 * Email Verification Routes
 * Управление верификацией email
 */

import express from 'express';
import { db } from '../db/connection.js';
import { logger } from '../utils/logger.js';
import { api as emailApi } from './email.js';

const router = express.Router();

/**
 * POST /api/email-verification/send
 * Отправить код верификации на email
 */
router.post('/send', async (req, res) => {
  try {
    const { email, userId, language = 'uk' } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Генерируем 6-значный код
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 минут

    // Находим пользователя, если userId не передан
    let targetUserId = userId;
    if (!targetUserId) {
      const userResult = await db.query(
        'SELECT id FROM users WHERE email = $1',
        [email.toLowerCase()]
      );
      if (userResult.rows.length > 0) {
        targetUserId = userResult.rows[0].id;
      }
    }

    // Удаляем старые коды для этого пользователя/email
    if (targetUserId) {
      await db.query(
        'DELETE FROM email_verifications WHERE user_id = $1 AND email = $2',
        [targetUserId, email.toLowerCase()]
      );
    } else {
      await db.query(
        'DELETE FROM email_verifications WHERE email = $1',
        [email.toLowerCase()]
      );
    }

    // Сохраняем новый код
    await db.query(
      `INSERT INTO email_verifications (user_id, email, token, expires_at)
       VALUES ($1, $2, $3, $4)`,
      [targetUserId || null, email.toLowerCase(), code, expiresAt]
    );

    // Отправляем email через Resend
    try {
      await emailApi.sendVerification(email, code, language);
      logger.info('Verification code email sent', { email });
    } catch (emailError) {
      logger.error('Failed to send verification email', {
        error: emailError.message || emailError,
        email,
        code, // Логируем код для отладки (только в development)
        stack: emailError.stack,
      });
      
      // В development возвращаем код в ответе для отладки
      if (process.env.NODE_ENV === 'development') {
        return res.json({ 
          success: true, 
          message: 'Verification code saved (email sending failed)',
          code: code, // Только для development!
          error: emailError.message || 'Email sending failed'
        });
      }
      
      // В production не раскрываем детали ошибки
      return res.json({ 
        success: true, 
        message: 'Verification code saved (email may not have been sent)',
        warning: 'Email service may be unavailable'
      });
    }

    res.json({ success: true, message: 'Verification code sent' });
  } catch (error) {
    logger.error('Send verification code error', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/email-verification/verify
 * Проверить код верификации
 */
router.post('/verify', async (req, res) => {
  try {
    const { email, code, userId } = req.body;

    if (!email || !code) {
      return res.status(400).json({ error: 'Email and code are required' });
    }

    // Находим запись верификации
    const verificationResult = await db.query(
      `SELECT * FROM email_verifications
       WHERE email = $1 AND token = $2 AND verified_at IS NULL AND expires_at > NOW()`,
      [email.toLowerCase(), code]
    );

    if (verificationResult.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid or expired code' });
    }

    const verification = verificationResult.rows[0];

    // Находим пользователя
    let targetUserId = userId || verification.user_id;
    if (!targetUserId) {
      const userResult = await db.query(
        'SELECT id FROM users WHERE email = $1',
        [email.toLowerCase()]
      );
      if (userResult.rows.length > 0) {
        targetUserId = userResult.rows[0].id;
      }
    }

    if (!targetUserId) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Обновляем email_verified в users и profiles
    await db.query(
      'UPDATE users SET email_verified = true WHERE id = $1',
      [targetUserId]
    );

    await db.query(
      'UPDATE profiles SET email_verified = true WHERE id = $1',
      [targetUserId]
    );

    // Помечаем код как использованный
    await db.query(
      'UPDATE email_verifications SET verified_at = NOW() WHERE id = $1',
      [verification.id]
    );

    res.json({ success: true, message: 'Email verified successfully' });
  } catch (error) {
    logger.error('Verify email code error', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

