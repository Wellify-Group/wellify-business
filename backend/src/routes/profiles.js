/**
 * Profiles Routes
 * Управление профилями пользователей
 */

import express from 'express';
import { db } from '../db/connection.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

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
 * PATCH /api/profiles/:id
 * Обновить профиль пользователя
 */
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
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

