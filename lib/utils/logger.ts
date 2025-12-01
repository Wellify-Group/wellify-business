// lib/utils/logger.ts
// Утилита для улучшенного логирования

type LogLevel = "info" | "warn" | "error" | "debug";

interface LogContext {
  [key: string]: any;
}

class Logger {
  private prefix: string;
  private enabled: boolean;

  constructor(prefix: string = "App") {
    this.prefix = prefix;
    this.enabled = process.env.NODE_ENV !== "production" || process.env.ENABLE_LOGGING === "true";
  }

  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` ${JSON.stringify(context)}` : "";
    return `[${timestamp}] [${this.prefix}] [${level.toUpperCase()}] ${message}${contextStr}`;
  }

  info(message: string, context?: LogContext): void {
    if (this.enabled) {
      console.log(this.formatMessage("info", message, context));
    }
  }

  warn(message: string, context?: LogContext): void {
    if (this.enabled) {
      console.warn(this.formatMessage("warn", message, context));
    }
  }

  error(message: string, error?: Error | unknown, context?: LogContext): void {
    const errorContext = {
      ...context,
      error: error instanceof Error ? {
        message: error.message,
        stack: error.stack,
        name: error.name,
      } : error,
    };
    console.error(this.formatMessage("error", message, errorContext));
  }

  debug(message: string, context?: LogContext): void {
    if (this.enabled && process.env.NODE_ENV === "development") {
      console.debug(this.formatMessage("debug", message, context));
    }
  }
}

// Экспортируем готовые логгеры для разных модулей
export const supportLogger = new Logger("Support");
export const telegramLogger = new Logger("Telegram");
export const sessionLogger = new Logger("Session");
export const websocketLogger = new Logger("WebSocket");

// Функция для создания кастомного логгера
export function createLogger(prefix: string): Logger {
  return new Logger(prefix);
}

