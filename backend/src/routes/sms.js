/**
 * SMS Routes
 * Отправка SMS через внешний сервис
 */

import express from 'express';
import { logger } from '../utils/logger.js';

const router = express.Router();

/**
 * POST /api/sms/send
 * Отправка SMS с кодом верификации
 * 
 * TODO: Интегрировать с SMS провайдером (Twilio альтернатива)
 */
router.post('/send', async (req, res) => {
  try {
    const { phone, code } = req.body;

    if (!phone || !code) {
      return res.status(400).json({ error: 'Phone and code are required' });
    }

    // TODO: Реализовать отправку SMS через провайдера
    // Пока просто логируем
    logger.info('SMS send requested', { phone, code: code.substring(0, 2) + '****' });

    // Временная заглушка - в production нужно подключить SMS API
    res.json({ 
      success: true, 
      message: 'SMS sent (mock)',
      // В development можно вернуть код для тестирования
      ...(process.env.NODE_ENV === 'development' && { code })
    });
  } catch (error) {
    logger.error('SMS send error', error);
    res.status(500).json({ error: 'Failed to send SMS' });
  }
});

export default router;

