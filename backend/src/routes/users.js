/**
 * Users Routes
 * Управление пользователями
 */

import express from 'express';
import { db } from '../db/connection.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

/**
 * GET /api/users
 * Получить список пользователей (admin only)
 */
router.get('/', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT u.id, u.email, u.email_verified, u.phone, u.phone_verified, u.created_at,
              p.full_name, p.role, p.language
       FROM users u
       LEFT JOIN profiles p ON u.id = p.id
       ORDER BY u.created_at DESC
       LIMIT 100`
    );

    res.json({ users: result.rows });
  } catch (error) {
    logger.error('Get users error', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/users/:id
 * Получить пользователя по ID
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.query(
      `SELECT u.id, u.email, u.email_verified, u.phone, u.phone_verified, u.created_at,
              p.full_name, p.avatar_url, p.role, p.language
       FROM users u
       LEFT JOIN profiles p ON u.id = p.id
       WHERE u.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user: result.rows[0] });
  } catch (error) {
    logger.error('Get user error', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

