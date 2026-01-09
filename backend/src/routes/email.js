/**
 * Email Routes
 * Отправка email через Resend
 */

import express from 'express';
import { Resend } from 'resend';
import { logger } from '../utils/logger.js';

const router = express.Router();

const resend = process.env.RESEND_API_KEY 
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

// Экспортируем API для использования в других роутах
export const api = {
  async sendVerification(email, code, language = 'uk') {
    if (!resend) {
      throw new Error('Resend API key not configured');
    }

    const texts = {
      ru: {
        subject: 'Код подтверждения Wellify Business',
        message: `Ваш код подтверждения: ${code}`,
      },
      uk: {
        subject: 'Код підтвердження Wellify Business',
        message: `Ваш код підтвердження: ${code}`,
      },
      en: {
        subject: 'Wellify Business Verification Code',
        message: `Your verification code: ${code}`,
      },
    };

    const text = texts[language] || texts.uk;

    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'Wellify Business <noreply@wellifyglobal.com>',
      to: email,
      subject: text.subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>${text.subject}</h2>
          <p>${text.message}</p>
          <p style="font-size: 24px; font-weight: bold; color: #050B13;">${code}</p>
          <p style="color: #666; font-size: 12px;">Этот код действителен в течение 15 минут.</p>
        </div>
      `,
    });

    if (error) {
      throw error;
    }

    return data;
  },
};

/**
 * POST /api/email/send-verification
 * Отправка email с кодом верификации
 */
router.post('/send-verification', async (req, res) => {
  try {
    const { email, code, language = 'uk' } = req.body;

    if (!email || !code) {
      return res.status(400).json({ error: 'Email and code are required' });
    }

    if (!resend) {
      logger.error('Resend API key not configured');
      return res.status(500).json({ error: 'Email service not configured' });
    }

    // Тексты для разных языков
    const texts = {
      ru: {
        subject: 'Код подтверждения Wellify Business',
        message: `Ваш код подтверждения: ${code}`,
      },
      uk: {
        subject: 'Код підтвердження Wellify Business',
        message: `Ваш код підтвердження: ${code}`,
      },
      en: {
        subject: 'Wellify Business Verification Code',
        message: `Your verification code: ${code}`,
      },
    };

    const text = texts[language] || texts.uk;

    // Отправляем email
    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'Wellify Business <noreply@wellifyglobal.com>',
      to: email,
      subject: text.subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>${text.subject}</h2>
          <p>${text.message}</p>
          <p style="font-size: 24px; font-weight: bold; color: #050B13;">${code}</p>
          <p style="color: #666; font-size: 12px;">Этот код действителен в течение 15 минут.</p>
        </div>
      `,
    });

    if (error) {
      logger.error('Resend email error', error);
      return res.status(500).json({ error: 'Failed to send email' });
    }

    logger.info('Verification email sent', { email, id: data?.id });

    res.json({ success: true, messageId: data?.id });
  } catch (error) {
    logger.error('Send verification email error', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

