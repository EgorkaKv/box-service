import { WinstonModuleOptions } from 'nest-winston';
import * as winston from 'winston';
import * as DailyRotateFile from 'winston-daily-rotate-file';
import { join } from 'path';

export class WinstonConfigService {
  static createWinstonConfig(): WinstonModuleOptions {
    const isDev = process.env.NODE_ENV === 'DEV';
    const logLevel = process.env.LOG_LEVEL || 'info';
    const logDir = join(process.cwd(), 'logs');

    // Sanitization format - скрытие чувствительных данных
    const sanitizeFormat = winston.format((info) => {
      const sensitiveFields = [
        'password', 'passwordHash', 'token', 'accessToken', 'refreshToken',
        'authorization', 'x-admin-password', 'jwt', 'secret', 'key'
      ];

      const sanitize = (obj: any): any => {
        if (typeof obj !== 'object' || obj === null) {
          return obj;
        }

        const sanitized = { ...obj };
        Object.keys(sanitized).forEach(key => {
          const lowerKey = key.toLowerCase();
          if (sensitiveFields.some(field => lowerKey.includes(field))) {
            sanitized[key] = '[REDACTED]';
          } else if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
            sanitized[key] = sanitize(sanitized[key]);
          }
        });

        return sanitized;
      };

      return sanitize(info);
    });

    // Формат для консоли (человекочитаемый)
    const consoleFormat = winston.format.combine(
      winston.format.colorize({ all: true }),
      winston.format.timestamp({ format: 'HH:mm:ss' }),
      winston.format.errors({ stack: true }),
      sanitizeFormat(),
      winston.format.printf(({ timestamp, level, message, context, stack, ...meta }) => {
        const contextStr = context ? `[${context}]` : '';

        // для HTTP логов показываем только основное сообщение
        if (context === 'HTTP') {
          const stackStr = stack ? `\n${stack}` : '';
          return `${timestamp} ${level} ${contextStr} ${message}${stackStr}`;
        }
        const metaStr = Object.keys(meta).length > 0 ? `\n${JSON.stringify(meta, null, 2)}` : '';
        const stackStr = stack ? `\n${stack}` : '';

        return `${timestamp} ${level} ${contextStr} ${message}${metaStr}${stackStr}`;
      })
    );

    // Формат для файлов (структурированный JSON)
    const fileFormat = winston.format.combine(
      winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      winston.format.errors({ stack: true }),
      sanitizeFormat(),
      winston.format.json()
    );

    // Транспорты для логирования
    const transports: winston.transport[] = [];

    // Консольный транспорт
    if (isDev) {
      transports.push(
        new winston.transports.Console({
          format: consoleFormat,
          level: logLevel,
        })
      );
    } else {
      // В продакшене также консоль, но с JSON форматом
      transports.push(
        new winston.transports.Console({
          format: fileFormat,
          level: logLevel,
        })
      );
    }

    // Фильтр для HTTP логов
    const httpOnlyFormat = winston.format((info) => {
      return info.context === 'HTTP' ? info : false;
    })

    // Файловые транспорты с ротацией
    transports.push(
      // Все логи
      new DailyRotateFile({
        filename: join(logDir, 'application-%DATE%.log'),
        datePattern: 'YYYY-MM-DD',
        zippedArchive: true,
        maxSize: '20m',
        maxFiles: '14d',
        format: fileFormat,
        level: logLevel,
      }),

      // Только ошибки
      new DailyRotateFile({
        filename: join(logDir, 'error-%DATE%.log'),
        datePattern: 'YYYY-MM-DD',
        zippedArchive: true,
        maxSize: '20m',
        maxFiles: '30d',
        format: fileFormat,
        level: 'error',
      }),

      // HTTP запросы - отдельный файл
      new DailyRotateFile({
        filename: join(logDir, 'http-%DATE%.log'),
        datePattern: 'YYYY-MM-DD',
        zippedArchive: true,
        maxSize: '50m',
        maxFiles: '30d',
        format: winston.format.combine(
          httpOnlyFormat(),
          winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
          sanitizeFormat(),
          winston.format.json()
        ),
        level: 'info', // Все HTTP логи записываются как info
      })
    );

    return {
      level: logLevel,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true })
      ),
      transports,
      exitOnError: false,
    };
  }
}
