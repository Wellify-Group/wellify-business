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
 * GET /api/locations/list
 * Получить все локации директора (по business_id)
 */
router.get('/list', authenticateToken, async (req, res) => {
  try {
    const userId = req.userId;
    console.log('📍 [GET /list] Fetching locations for userId:', userId);
    
    // НЕ используем req.query.businessId - определяем из userId
    // ИСПОЛЬЗУЕМ owner_profile_id вместо director_id
    const businessQuery = `
      SELECT id, owner_profile_id, название, код_компании
      FROM businesses 
      WHERE owner_profile_id = $1
    `;
    
    const businessResult = await db.query(businessQuery, [userId]);
    console.log('🏢 [GET /list] Business query result:', {
      userId,
      found: businessResult.rows.length,
      businesses: businessResult.rows.map(b => ({
        id: b.id,
        owner_profile_id: b.owner_profile_id,
        название: b.название
      }))
    });
    
    if (businessResult.rows.length === 0) {
      console.log('❌ [GET /list] No business found for userId:', userId);
      return res.json({ 
        success: true,
        locations: [] 
      });
    }
    
    const businessId = businessResult.rows[0].id;
    console.log('✅ [GET /list] Business ID:', businessId);
    
    // Получаем локации БЕЗ алиаса "l." с русскими названиями колонок
    const locationsQuery = `
      SELECT 
        id, 
        business_id,
        название as name, 
        адрес as address, 
        тип as type,
        код_точки as point_code,
        менеджер_ключ as manager_key,
        активна as active,
        код_компании as company_code,
        created_at, 
        updated_at
      FROM locations 
      WHERE business_id = $1
      ORDER BY created_at DESC
    `;
    
    const locationsResult = await db.query(locationsQuery, [businessId]);
    console.log('📍 [GET /list] Locations query result:', {
      businessId,
      found: locationsResult.rows.length,
      locations: locationsResult.rows.map(l => ({
        id: l.id,
        name: l.name,
        business_id: l.business_id
      }))
    });
    
    res.json({ 
      success: true,
      locations: locationsResult.rows 
    });
    
  } catch (error) {
    console.error('❌ [GET /list] Error fetching locations:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch locations',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

/**
 * GET /api/locations
 * Получить все локации пользователя
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { business_id } = req.query;

    // Проверяем доступ: либо пользователь владелец бизнеса, либо сотрудник с активным статусом
    let query = `
      SELECT DISTINCT 
        id, 
        business_id, 
        название as name, 
        адрес as address, 
        менеджер_ключ as access_code, 
        created_at, 
        updated_at
      FROM locations
      JOIN businesses ON locations.business_id = businesses.id
      WHERE (
        businesses.owner_profile_id = $1
        OR EXISTS (
          SELECT 1 FROM staff 
          WHERE staff.business_id = businesses.id 
          AND staff.profile_id = $1 
          AND staff.активен = true
        )
      )
    `;
    const params = [req.userId];

    if (business_id) {
      query += ' AND locations.business_id = $2';
      params.push(business_id);
    }

    query += ' ORDER BY created_at DESC';

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

    // Проверяем, что пользователь имеет доступ к бизнесу: либо владелец, либо активный сотрудник
    const businessCheck = await db.query(
      `SELECT b.id FROM businesses b
       WHERE b.id = $1 
       AND (
         b.owner_profile_id = $2
         OR EXISTS (
           SELECT 1 FROM staff s 
           WHERE s.business_id = b.id 
           AND s.profile_id = $2 
           AND s.активен = true
         )
       )`,
      [business_id, req.userId]
    );

    if (businessCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Access denied to this business' });
    }

    // Генерируем уникальный код_точки автоматически
    const pointCode = `LOC-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    
    // Создаём локацию
    const result = await db.query(
      `INSERT INTO locations (business_id, код_точки, название, адрес, менеджер_ключ, активна)
       VALUES ($1, $2, $3, $4, $5, true)
       RETURNING id, business_id, код_точки as point_code, название as name, адрес as address, менеджер_ключ as access_code, активна as active, created_at, updated_at`,
      [business_id, pointCode, name, address || null, access_code || null]
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

    // Проверяем доступ: либо владелец бизнеса, либо активный сотрудник
    const locationCheck = await db.query(
      `SELECT id 
       FROM locations
       JOIN businesses ON locations.business_id = businesses.id
       WHERE locations.id = $1 
       AND (
         businesses.owner_profile_id = $2
         OR EXISTS (
           SELECT 1 FROM staff 
           WHERE staff.business_id = businesses.id 
           AND staff.profile_id = $2 
           AND staff.активен = true
         )
       )`,
      [id, req.userId]
    );

    if (locationCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Location not found or access denied' });
    }

    // Обновляем локацию
    const result = await db.query(
      `UPDATE locations
       SET название = COALESCE($1, название),
           адрес = COALESCE($2, адрес),
           менеджер_ключ = COALESCE($3, менеджер_ключ),
           updated_at = NOW()
       WHERE id = $4
       RETURNING id, business_id, название as name, адрес as address, менеджер_ключ as access_code, created_at, updated_at`,
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
      `SELECT id 
       FROM locations
       JOIN businesses ON locations.business_id = businesses.id
       WHERE locations.id = $1 
       AND (
         businesses.owner_profile_id = $2
         OR EXISTS (
           SELECT 1 FROM staff 
           WHERE staff.business_id = businesses.id 
           AND staff.profile_id = $2 
           AND staff.активен = true
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
