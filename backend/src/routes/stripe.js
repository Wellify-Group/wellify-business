/**
 * Stripe Webhook Routes
 * Обработка Stripe webhooks
 */

import express from 'express';
import Stripe from 'stripe';
import { db } from '../db/connection.js';
import { logger } from '../utils/logger.js';

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
});

// Middleware для проверки webhook secret (используется в Next.js route)
// Этот роут используется для прямых вызовов из Stripe, но обычно webhook обрабатывается в Next.js

/**
 * POST /api/stripe/webhook-handler
 * Обработчик webhook событий (вызывается из Next.js route)
 * Примечание: Next.js route уже проверил подпись, здесь просто обрабатываем событие
 */
router.post('/webhook-handler', express.json(), async (req, res) => {
  try {
    // Next.js route уже проверил подпись и передал событие
    const event = req.body as Stripe.Event;

    if (!event || !event.type) {
      return res.status(400).json({ error: 'Invalid event data' });
    }

    try {
      switch (event.type) {
        case 'checkout.session.completed': {
          const session = event.data.object;
          const customerId = session.customer;
          const subscriptionId = session.subscription;

          if (!subscriptionId) {
            break;
          }

          // Get subscription details
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);

          // Find user by customer ID
          const existingSub = await db.query(
            'SELECT user_id FROM user_subscriptions WHERE stripe_customer_id = $1',
            [customerId]
          );

          if (existingSub.rows.length > 0) {
            // Update subscription
            await db.query(
              `UPDATE user_subscriptions
               SET stripe_subscription_id = $1,
                   status = $2,
                   current_period_start = $3,
                   current_period_end = $4,
                   updated_at = NOW()
               WHERE user_id = $5`,
              [
                subscriptionId,
                subscription.status,
                new Date(subscription.current_period_start * 1000),
                new Date(subscription.current_period_end * 1000),
                existingSub.rows[0].user_id,
              ]
            );
          } else {
            // Find user by email from session
            const email = session.customer_details?.email || session.customer_email;
            if (email) {
              const userResult = await db.query(
                'SELECT id FROM users WHERE email = $1',
                [email.toLowerCase()]
              );

              if (userResult.rows.length > 0) {
                await db.query(
                  `INSERT INTO user_subscriptions (
                    user_id, stripe_customer_id, stripe_subscription_id,
                    status, current_period_start, current_period_end
                  )
                  VALUES ($1, $2, $3, $4, $5, $6)
                  ON CONFLICT (stripe_subscription_id) DO UPDATE
                  SET status = $4,
                      current_period_start = $5,
                      current_period_end = $6,
                      updated_at = NOW()`,
                  [
                    userResult.rows[0].id,
                    customerId,
                    subscriptionId,
                    subscription.status,
                    new Date(subscription.current_period_start * 1000),
                    new Date(subscription.current_period_end * 1000),
                  ]
                );
              }
            }
          }
          break;
        }

        case 'customer.subscription.updated': {
          const subscription = event.data.object;
          const customerId = subscription.customer;

          await db.query(
            `UPDATE user_subscriptions
             SET status = $1,
                 current_period_start = $2,
                 current_period_end = $3,
                 cancel_at_period_end = $4,
                 updated_at = NOW()
             WHERE stripe_customer_id = $5`,
            [
              subscription.status,
              subscription.current_period_start ? new Date(subscription.current_period_start * 1000) : null,
              subscription.current_period_end ? new Date(subscription.current_period_end * 1000) : null,
              subscription.cancel_at_period_end || false,
              customerId,
            ]
          );
          break;
        }

        case 'customer.subscription.deleted': {
          const subscription = event.data.object;
          const customerId = subscription.customer;

          await db.query(
            `UPDATE user_subscriptions
             SET status = 'canceled',
                 updated_at = NOW()
             WHERE stripe_customer_id = $1`,
            [customerId]
          );
          break;
        }

        default:
          logger.info(`Unhandled event type: ${event.type}`);
      }

      res.json({ received: true });
    } catch (error) {
      logger.error('Webhook handler error', error);
      res.status(500).json({ error: 'Webhook handler failed' });
    }
  } catch (error) {
    logger.error('Webhook processing error', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
