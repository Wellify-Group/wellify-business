/**
 * Locations Routes
 * Управление локациями/точками бизнеса
 */

import express from 'express';
import { db } from '../db/connection.js';
import { logger } from '../utils/logger.js';
import jwt from 'jsonwebtoken';

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
 * GET /api/locations
 * Получить все локации пользователя
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { business_id } = req.query;

    // Проверяем доступ: либо пользователь владелец бизнеса, либо сотрудник с активным статусом
    let query = `
      SELECT DISTINCT l.id, l.business_id, l.name, l.address, l.access_code, l.created_at, l.updated_at
      FROM locations l
      JOIN businesses b ON l.business_id = b.id
      WHERE (
        b.owner_profile_id = $1
        OR EXISTS (
          SELECT 1 FROM staff s 
          WHERE s.business_id = b.id 
          AND s.profile_id = $1 
          AND s.активен = true
        )
      )
    `;
    const params = [req.userId];

    if (business_id) {
      query += ' AND l.business_id = $2';
      params.push(business_id);
    }

    query += ' ORDER BY l.created_at DESC';

    const result = await db.query(query, params);

    res.json({
      locations: result.rows.map(l => ({
        id: l.id,
        businessId: l.business_id,
        name: l.name,
        address: l.address,
        accessCode: l.access_code,
        createdAt: l.created_at,
        updatedAt: l.updated_at,
      })),
    });
  } catch (error) {
    logger.error('Get locations error', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/locations
 * Создать новую локацию
 */
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { business_id, name, address, access_code } = req.body;

    if (!business_id || !name) {
      return res.status(400).json({ error: 'Business ID and name are required' });
    }

    // Проверяем, что пользователь имеет доступ к бизнесу
    const businessCheck = await db.query(
      `SELECT b.id FROM businesses b
       JOIN staff s ON b.id = s.business_id
       WHERE b.id = $1 AND s.profile_id = $2 AND s.активен = true`,
      [business_id, req.userId]
    );

    if (businessCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Access denied to this business' });
    }

    // Создаём локацию
    const result = await db.query(
      `INSERT INTO locations (business_id, name, address, access_code)
       VALUES ($1, $2, $3, $4)
       RETURNING id, business_id, name, address, access_code, created_at, updated_at`,
      [business_id, name, address || null, access_code || null]
    );

    const location = result.rows[0];
    res.status(201).json({
      success: true,
      location: {
        id: location.id,
        businessId: location.business_id,
        name: location.name,
        address: location.address,
        accessCode: location.access_code,
        createdAt: location.created_at,
        updatedAt: location.updated_at,
      },
    });
  } catch (error) {
    logger.error('Create location error', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * PUT /api/locations/:id
 * Обновить локацию
 */
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, address, access_code } = req.body;

    // Проверяем доступ
    const locationCheck = await db.query(
      `SELECT l.id FROM locations l
       JOIN businesses b ON l.business_id = b.id
       JOIN staff s ON b.id = s.business_id
       WHERE l.id = $1 AND s.profile_id = $2 AND s.активен = true`,
      [id, req.userId]
    );

    if (locationCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Location not found or access denied' });
    }

    // Обновляем локацию
    const result = await db.query(
      `UPDATE locations
       SET name = COALESCE($1, name),
           address = COALESCE($2, address),
           access_code = COALESCE($3, access_code),
           updated_at = NOW()
       WHERE id = $4
       RETURNING id, business_id, name, address, access_code, created_at, updated_at`,
      [name, address, access_code, id]
    );

    const location = result.rows[0];
    res.json({
      success: true,
      location: {
        id: location.id,
        businessId: location.business_id,
        name: location.name,
        address: location.address,
        accessCode: location.access_code,
        createdAt: location.created_at,
        updatedAt: location.updated_at,
      },
    });
  } catch (error) {
    logger.error('Update location error', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * DELETE /api/locations/:id
 * Удалить локацию
 */
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Проверяем доступ: либо владелец бизнеса, либо активный сотрудник
    const locationCheck = await db.query(
      `SELECT l.id FROM locations l
       JOIN businesses b ON l.business_id = b.id
       WHERE l.id = $1 
       AND (
         b.owner_profile_id = $2
         OR EXISTS (
           SELECT 1 FROM staff s 
           WHERE s.business_id = b.id 
           AND s.profile_id = $2 
           AND s.активен = true
         )
       )`,
      [id, req.userId]
    );

    if (locationCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Location not found or access denied' });
    }

    // Удаляем локацию
    await db.query('DELETE FROM locations WHERE id = $1', [id]);

    res.json({ success: true, message: 'Location deleted' });
  } catch (error) {
    logger.error('Delete location error', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
