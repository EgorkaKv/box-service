import { Injectable, LoggerService, Inject } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';


@Injectable()
export class AppLogger implements LoggerService {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger
  ) {}

  log(message: string, context?: string, metadata?: Record<string, any>) {
    this.logger.info(message, {
      context: context || 'Application',
      ...metadata
    });
  }

  error(message: string, trace?: string, context?: string, metadata?: Record<string, any>) {
    this.logger.error(message, {
      context: context || 'Application',
      stack: trace,
      ...metadata,
    });
  }

  warn(message: string, context?: string, metadata?: Record<string, any>) {
    this.logger.warn(message, {
      context: context || 'Application',
      ...metadata
    });
  }

  debug(message: string, context?: string, metadata?: Record<string, any>) {
    this.logger.debug(message, {
      context: context || 'Application',
      ...metadata
    });
  }

  verbose(message: string, context?: string, metadata?: Record<string, any>) {
    this.logger.verbose(message, {
      context: context || 'Application',
      ...metadata
    });
  }

  // Наши кастомные методы для домена
  logRequest(method: string, url: string, statusCode: number, responseTime: number, context?: string, metadata?: Record<string, any>) {
    // Определяем тип запроса для лучшей категоризации
    const requestType = this.categorizeRequest(method, url, statusCode);
    const statusIcon = this.getStatusIcon(statusCode);
    const responseTimeFormatted = this.formatResponseTime(responseTime);

    // Компактное сообщение для консоли
    const message = `${method} ${url} → ${statusCode} ${statusIcon} ${responseTimeFormatted}`;

    // Расширенные метаданные для файла
    const enrichedMetadata = {
      context: context || 'HTTP',
      method,
      url,
      statusCode,
      responseTime: `${responseTime}ms`,
      requestType,
      isError: statusCode >= 400,
      isSlowRequest: responseTime > 500,
      ...metadata,
    };

    // Логируем с правильным уровнем
    if (statusCode >= 500) {
      this.logger.error(message, enrichedMetadata);
    } else if (statusCode >= 400) {
      this.logger.warn(message, enrichedMetadata);
    } else {
      this.logger.info(message, enrichedMetadata);
    }
  }

  private categorizeRequest(method: string, url: string, statusCode: number): string {
    // Категоризируем запросы для аналитики
    if (url.includes('/auth/')) return 'authentication';
    if (url.includes('/boxes/')) return 'boxes';
    if (url.includes('/health')) return 'monitoring';
    if (url.includes('/metrics')) return 'monitoring';
    if (url.includes('/static/') || url.includes('.css') || url.includes('.js')) return 'static';
    if (method === 'OPTIONS') return 'cors';
    return 'api';
  }

  private getStatusIcon(statusCode: number): string {
    if (statusCode >= 200 && statusCode < 300) return '✅';
    if (statusCode >= 300 && statusCode < 400) return '➡️';
    if (statusCode >= 400 && statusCode < 500) return '⚠️';
    if (statusCode >= 500) return '❌';
    return '❓';
  }

  private formatResponseTime(ms: number): string {
    if (ms < 100) return `(${ms}ms)`;
    if (ms < 500) return `(${ms}ms 🟡)`;
    if (ms < 1000) return `(${ms}ms 🟠)`;
    return `(${ms}ms 🔴)`;
  }

  logAuth(action: string, userId?: string | number, storeId?: string | number, context?: string, metadata?: Record<string, any>) {
    this.logger.info(`Auth: ${action}`, {
      context: context || 'Auth',
      userId: userId?.toString(),
      storeId: storeId?.toString(),
      ...metadata,
    });
  }

  logDatabase(operation: string, entity: string, duration?: number, context?: string, metadata?: Record<string, any>) {
    this.logger.debug(`DB: ${operation}`, {
      context: context || 'Database',
      entity,
      duration: duration ? `${duration}ms` : undefined,
      ...metadata,
    });
  }

  logError(error: Error, context?: string, metadata?: Record<string, any>) {
    this.logger.error(error.message, {
      context: context || 'Application',
      stack: error.stack,
      name: error.name,
      ...metadata,
    });
  }

  // Методы для получения прямого доступа к Winston (если нужно)
  getWinstonLogger(): Logger {
    return this.logger;
  }

  // Метод для массового логирования (для производительности)
  logBatch(entries: Array<{level: string, message: string, context?: string, metadata?: Record<string, any>}>) {
    entries.forEach(entry => {
      this.logger.log(entry.level, entry.message, {
        context: entry.context || 'Application',
        ...entry.metadata
      });
    });
  }
}
