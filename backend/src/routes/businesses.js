/**
 * Businesses Routes
 * Управление бизнесами/компаниями
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
 * POST /api/businesses
 * Создать новый бизнес
 */
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { название, код_компании } = req.body;

    if (!название || !код_компании) {
      return res.status(400).json({ error: 'Business name and company code are required' });
    }

    // Проверяем, существует ли код компании
    const existing = await db.query(
      'SELECT id FROM businesses WHERE код_компании = $1',
      [код_компании]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'Company code already exists' });
    }

    // Создаём бизнес
    const result = await db.query(
      `INSERT INTO businesses (owner_profile_id, название, код_компании)
       VALUES ($1, $2, $3)
       RETURNING id, название, код_компании, created_at`,
      [req.userId, название, код_компании]
    );

    const business = result.rows[0];

    // Создаём запись в staff для директора
    await db.query(
      `INSERT INTO staff (profile_id, business_id, роль, должность, активен)
       VALUES ($1, $2, $3, $4, $5)`,
      [req.userId, business.id, 'директор', 'владелец', true]
    );

    res.status(201).json({
      success: true,
      business: {
        id: business.id,
        name: business.название,
        companyCode: business.код_компании,
      },
    });
  } catch (error) {
    logger.error('Create business error', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/businesses
 * Получить бизнесы пользователя (как владельца или как сотрудника)
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    // Получаем бизнесы где пользователь является владельцем или сотрудником
    const result = await db.query(
      `SELECT DISTINCT b.id, b.название, b.код_компании, b.created_at
       FROM businesses b
       LEFT JOIN staff s ON b.id = s.business_id
       WHERE (b.owner_profile_id = $1 OR s.profile_id = $1)
         AND (s.активен = true OR s.активен IS NULL)
       ORDER BY b.created_at DESC`,
      [req.userId]
    );

    res.json({
      businesses: result.rows.map(b => ({
        id: b.id,
        name: b.название,
        companyCode: b.код_компании,
        createdAt: b.created_at,
      })),
    });
  } catch (error) {
    logger.error('Get businesses error', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/businesses/:id
 * Получить бизнес по ID
 */
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.query(
      `SELECT b.id, b.название, b.код_компании, b.created_at
       FROM businesses b
       JOIN staff s ON b.id = s.business_id
       WHERE b.id = $1 AND s.profile_id = $2 AND s.активен = true`,
      [id, req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Business not found' });
    }

    const business = result.rows[0];
    res.json({
      business: {
        id: business.id,
        name: business.название,
        companyCode: business.код_компании,
        createdAt: business.created_at,
      },
    });
  } catch (error) {
    logger.error('Get business error', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
