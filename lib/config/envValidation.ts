// lib/config/envValidation.ts
// Централизованная валидация переменных окружения
// Используется при старте приложения для fail-fast проверки

import 'server-only';

interface EnvValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Валидация клиентских (публичных) переменных окружения
 * Эти переменные доступны в браузере
 */
export function validateClientEnv(): EnvValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Обязательные клиентские переменные
  if (!process.env.NEXT_PUBLIC_API_URL) {
    errors.push('NEXT_PUBLIC_API_URL is required');
  }

  if (!process.env.NEXT_PUBLIC_APP_URL) {
    errors.push('NEXT_PUBLIC_APP_URL is required');
  }

  // Опциональные, но рекомендуемые
  if (!process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME) {
    warnings.push('NEXT_PUBLIC_TELEGRAM_BOT_USERNAME is not set (Telegram bot features may not work)');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Валидация серверных переменных окружения
 * Эти переменные НЕ должны быть доступны в браузере
 */
export function validateServerEnv(): EnvValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Проверка, что серверные ключи не попали в клиент
  if (process.env.NEXT_PUBLIC_JWT_SECRET) {
    errors.push('JWT_SECRET must NOT have NEXT_PUBLIC_ prefix (security risk!)');
  }

  if (process.env.NEXT_PUBLIC_RESEND_API_KEY) {
    errors.push('RESEND_API_KEY must NOT have NEXT_PUBLIC_ prefix (security risk!)');
  }

  if (process.env.NEXT_PUBLIC_TELEGRAM_BOT_TOKEN) {
    errors.push('TELEGRAM_BOT_TOKEN must NOT have NEXT_PUBLIC_ prefix (security risk!)');
  }

  // Опциональные, но рекомендуемые для полной функциональности
  if (!process.env.TELEGRAM_BOT_TOKEN) {
    warnings.push('TELEGRAM_BOT_TOKEN is not set (Telegram bot will not work)');
  }

  if (!process.env.RESEND_API_KEY) {
    warnings.push('RESEND_API_KEY is not set (Email sending via Resend will not work)');
  }

  if (!process.env.RESEND_FROM_EMAIL) {
    warnings.push('RESEND_FROM_EMAIL is not set (Email sending may fail)');
  }

  // Проверка формата email для Resend
  if (process.env.RESEND_FROM_EMAIL) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(process.env.RESEND_FROM_EMAIL)) {
      errors.push('RESEND_FROM_EMAIL must be a valid email address');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Валидация переменных для Telegram бота (Render)
 */
export function validateTelegramBotEnv(): EnvValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!process.env.TELEGRAM_BOT_TOKEN) {
    errors.push('TELEGRAM_BOT_TOKEN is required for Telegram bot');
  }

  if (!process.env.WEBHOOK_URL && process.env.NODE_ENV === 'production') {
    errors.push('WEBHOOK_URL is required in production for Telegram bot webhook mode');
  }

  if (!process.env.NEXT_PUBLIC_API_URL && !process.env.RENDER_API_URL) {
    warnings.push('NEXT_PUBLIC_API_URL or RENDER_API_URL should be set for backend API connection');
  }

  if (!process.env.APP_BASE_URL && !process.env.NEXT_PUBLIC_APP_URL) {
    warnings.push('APP_BASE_URL or NEXT_PUBLIC_APP_URL should be set for Telegram bot links');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Полная валидация всех переменных окружения
 */
export function validateAllEnv(): EnvValidationResult {
  const clientResult = validateClientEnv();
  const serverResult = validateServerEnv();

  const allErrors = [...clientResult.errors, ...serverResult.errors];
  const allWarnings = [...clientResult.warnings, ...serverResult.warnings];

  return {
    valid: allErrors.length === 0,
    errors: allErrors,
    warnings: allWarnings,
  };
}

/**
 * Выбросить ошибку, если валидация не прошла
 */
export function assertEnvValid(result: EnvValidationResult, context = 'Environment validation'): void {
  if (!result.valid) {
    const errorMessage = [
      `${context} failed:`,
      ...result.errors.map((e) => `  ❌ ${e}`),
      ...(result.warnings.length > 0
        ? ['', 'Warnings:', ...result.warnings.map((w) => `  ⚠️  ${w}`)]
        : []),
    ].join('\n');
    throw new Error(errorMessage);
  }

  if (result.warnings.length > 0) {
    console.warn(
      `${context} warnings:`,
      ...result.warnings.map((w) => `  ⚠️  ${w}`)
    );
  }
}

