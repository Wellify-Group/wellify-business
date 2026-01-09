/**
 * Profiles Routes
 * Управление профилями пользователей
 */

import express from 'express';
import jwt from 'jsonwebtoken';
import { db } from '../db/connection.js';
import { logger } from '../utils/logger.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Middleware для проверки токена
const authenticateToken = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

/**
 * GET /api/profiles/me
 * Получить текущий профиль пользователя
 */
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT p.*, u.email, u.email_verified, u.phone as user_phone, u.phone_verified
       FROM profiles p
       JOIN users u ON p.id = u.id
       WHERE p.id = $1`,
      [req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    const profile = result.rows[0];
    res.json({ profile });
  } catch (error) {
    logger.error('Get my profile error', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/profiles/:id
 * Получить профиль пользователя
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.query(
      `SELECT p.*, u.email, u.email_verified
       FROM profiles p
       JOIN users u ON p.id = u.id
       WHERE p.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    res.json({ profile: result.rows[0] });
  } catch (error) {
    logger.error('Get profile error', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * PATCH /api/profiles/me
 * Обновить текущий профиль пользователя
 */
router.patch('/me', authenticateToken, async (req, res) => {
  try {
    const { full_name, avatar_url, role, language, phone, phone_verified } = req.body;

    const updates = [];
    const values = [];
    let paramIndex = 1;

    if (full_name !== undefined) {
      updates.push(`full_name = $${paramIndex++}`);
      values.push(full_name);
    }
    if (avatar_url !== undefined) {
      updates.push(`avatar_url = $${paramIndex++}`);
      values.push(avatar_url);
    }
    if (role !== undefined) {
      updates.push(`role = $${paramIndex++}`);
      values.push(role);
    }
    if (language !== undefined) {
      updates.push(`language = $${paramIndex++}`);
      values.push(language);
    }
    if (phone !== undefined) {
      updates.push(`phone = $${paramIndex++}`);
      values.push(phone);
    }
    if (phone_verified !== undefined) {
      updates.push(`phone_verified = $${paramIndex++}`);
      values.push(phone_verified);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    values.push(req.userId);

    const query = `
      UPDATE profiles
      SET ${updates.join(', ')}, updated_at = NOW()
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await db.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    res.json({ profile: result.rows[0] });
  } catch (error) {
    logger.error('Update my profile error', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * PATCH /api/profiles/:id
 * Обновить профиль пользователя
 */
router.patch('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Проверяем, что пользователь обновляет свой профиль
    if (id !== req.userId) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    
    const { full_name, avatar_url, role, language, phone, phone_verified } = req.body;

    const updates = [];
    const values = [];
    let paramIndex = 1;

    if (full_name !== undefined) {
      updates.push(`full_name = $${paramIndex++}`);
      values.push(full_name);
    }
    if (avatar_url !== undefined) {
      updates.push(`avatar_url = $${paramIndex++}`);
      values.push(avatar_url);
    }
    if (role !== undefined) {
      updates.push(`role = $${paramIndex++}`);
      values.push(role);
    }
    if (language !== undefined) {
      updates.push(`language = $${paramIndex++}`);
      values.push(language);
    }
    if (phone !== undefined) {
      updates.push(`phone = $${paramIndex++}`);
      values.push(phone);
    }
    if (phone_verified !== undefined) {
      updates.push(`phone_verified = $${paramIndex++}`);
      values.push(phone_verified);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    values.push(id);

    const query = `
      UPDATE profiles
      SET ${updates.join(', ')}, updated_at = NOW()
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await db.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    res.json({ profile: result.rows[0] });
  } catch (error) {
    logger.error('Update profile error', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

