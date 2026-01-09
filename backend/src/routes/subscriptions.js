/**
 * Subscriptions Routes
 * Управление Stripe подписками
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
 * GET /api/subscriptions
 * Получить подписку пользователя
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT id, stripe_customer_id, stripe_subscription_id, stripe_price_id,
              status, plan_type, current_period_start, current_period_end,
              cancel_at_period_end, created_at, updated_at
       FROM user_subscriptions
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 1`,
      [req.userId]
    );

    if (result.rows.length === 0) {
      return res.json({ subscription: null });
    }

    res.json({ subscription: result.rows[0] });
  } catch (error) {
    logger.error('Get subscription error', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/subscriptions
 * Создать или обновить подписку
 */
router.post('/', authenticateToken, async (req, res) => {
  try {
    const {
      stripe_customer_id,
      stripe_subscription_id,
      stripe_price_id,
      status,
      plan_type,
      current_period_start,
      current_period_end,
      cancel_at_period_end,
    } = req.body;

    // Проверяем существующую подписку
    const existing = await db.query(
      'SELECT id FROM user_subscriptions WHERE user_id = $1',
      [req.userId]
    );

    let subscription;

    if (existing.rows.length > 0) {
      // Обновляем существующую
      const result = await db.query(
        `UPDATE user_subscriptions
         SET stripe_customer_id = COALESCE($1, stripe_customer_id),
             stripe_subscription_id = COALESCE($2, stripe_subscription_id),
             stripe_price_id = COALESCE($3, stripe_price_id),
             status = COALESCE($4, status),
             plan_type = COALESCE($5, plan_type),
             current_period_start = COALESCE($6, current_period_start),
             current_period_end = COALESCE($7, current_period_end),
             cancel_at_period_end = COALESCE($8, cancel_at_period_end),
             updated_at = NOW()
         WHERE user_id = $9
         RETURNING *`,
        [
          stripe_customer_id,
          stripe_subscription_id,
          stripe_price_id,
          status,
          plan_type,
          current_period_start,
          current_period_end,
          cancel_at_period_end,
          req.userId,
        ]
      );
      subscription = result.rows[0];
    } else {
      // Создаём новую
      const result = await db.query(
        `INSERT INTO user_subscriptions (
          user_id, stripe_customer_id, stripe_subscription_id, stripe_price_id,
          status, plan_type, current_period_start, current_period_end, cancel_at_period_end
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *`,
        [
          req.userId,
          stripe_customer_id,
          stripe_subscription_id,
          stripe_price_id,
          status,
          plan_type,
          current_period_start,
          current_period_end,
          cancel_at_period_end || false,
        ]
      );
      subscription = result.rows[0];
    }

    res.json({ subscription });
  } catch (error) {
    logger.error('Create/update subscription error', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * PUT /api/subscriptions/:id
 * Обновить подписку по ID
 */
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      stripe_customer_id,
      stripe_subscription_id,
      stripe_price_id,
      status,
      plan_type,
      current_period_start,
      current_period_end,
      cancel_at_period_end,
    } = req.body;

    // Проверяем, что подписка принадлежит пользователю
    const check = await db.query(
      'SELECT id FROM user_subscriptions WHERE id = $1 AND user_id = $2',
      [id, req.userId]
    );

    if (check.rows.length === 0) {
      return res.status(404).json({ error: 'Subscription not found' });
    }

    const result = await db.query(
      `UPDATE user_subscriptions
       SET stripe_customer_id = COALESCE($1, stripe_customer_id),
           stripe_subscription_id = COALESCE($2, stripe_subscription_id),
           stripe_price_id = COALESCE($3, stripe_price_id),
           status = COALESCE($4, status),
           plan_type = COALESCE($5, plan_type),
           current_period_start = COALESCE($6, current_period_start),
           current_period_end = COALESCE($7, current_period_end),
           cancel_at_period_end = COALESCE($8, cancel_at_period_end),
           updated_at = NOW()
       WHERE id = $9
       RETURNING *`,
      [
        stripe_customer_id,
        stripe_subscription_id,
        stripe_price_id,
        status,
        plan_type,
        current_period_start,
        current_period_end,
        cancel_at_period_end,
        id,
      ]
    );

    res.json({ subscription: result.rows[0] });
  } catch (error) {
    logger.error('Update subscription error', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
