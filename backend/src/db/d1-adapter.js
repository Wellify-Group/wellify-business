/**
 * Cloudflare D1 Database Adapter
 * Поддержка D1 через HTTP API для использования вне Cloudflare Workers
 * 
 * ВАЖНО: Для production рекомендуется использовать D1 напрямую через Cloudflare Workers.
 * Этот адаптер использует HTTP API, что менее эффективно, но работает из обычного Node.js.
 */

import { logger } from '../utils/logger.js';

/**
 * D1 HTTP API Client
 * Использует Cloudflare D1 HTTP API для выполнения запросов
 */
class D1Adapter {
  constructor(config) {
    this.accountId = config.accountId;
    this.databaseId = config.databaseId;
    this.apiToken = config.apiToken;
    this.baseUrl = `https://api.cloudflare.com/client/v4/accounts/${this.accountId}/d1/database/${this.databaseId}/query`;
  }

  /**
   * Выполнить SQL запрос через D1 HTTP API
   */
  async query(sql, params = []) {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sql,
          params: params.map(p => {
            // Конвертируем типы для D1
            if (p === null) return null;
            if (typeof p === 'boolean') return p ? 1 : 0;
            return String(p);
          }),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`D1 API error: ${error.errors?.[0]?.message || response.statusText}`);
      }

      const result = await response.json();
      
      // Конвертируем результат в формат, совместимый с pg
      return {
        rows: result.result?.[0]?.results || [],
        rowCount: result.result?.[0]?.results?.length || 0,
      };
    } catch (error) {
      logger.error('D1 query error', { error, sql, params });
      throw error;
    }
  }

  /**
   * Эмитация Pool методов для совместимости
   */
  async connect() {
    return this;
  }

  async end() {
    // Нет соединения для закрытия в HTTP API
  }

  on(event, callback) {
    // Эмитация событий для совместимости
    if (event === 'error') {
      this.errorCallback = callback;
    }
  }
}

/**
 * Создать D1 адаптер из переменных окружения
 */
export function createD1Adapter() {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const databaseId = process.env.CLOUDFLARE_D1_DATABASE_ID;
  const apiToken = process.env.CLOUDFLARE_API_TOKEN;

  if (!accountId || !databaseId || !apiToken) {
    throw new Error('D1 configuration missing. Set CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_D1_DATABASE_ID, and CLOUDFLARE_API_TOKEN');
  }

  return new D1Adapter({ accountId, databaseId, apiToken });
}

/**
 * Проверить доступность D1
 */
export async function testD1Connection(d1) {
  try {
    await d1.query('SELECT 1 as test');
    logger.info('D1 connection test successful');
    return true;
  } catch (error) {
    logger.error('D1 connection test failed', error);
    return false;
  }
}
