import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { Request, Response } from 'express';
import { AppLogger } from '../logger/app-logger.service';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(private readonly logger: AppLogger) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const startTime = Date.now();
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();

    const method = request.method;
    const url = request.url;
    const userAgent = request.get('User-Agent') || '';
    const ip = request.ip || request.connection.remoteAddress;
    const contentLength = request.get('Content-Length');

    return next.handle().pipe(
      tap(() => {
        const responseTime = Date.now() - startTime;
        const statusCode = response.statusCode;
        const responseSize = response.get('Content-Length');

        // Используем наш специальный метод logRequest
        this.logger.logRequest(method, url, statusCode, responseTime, 'HTTP', {
          ip,
          userAgent: this.categorizeUserAgent(userAgent),
          requestSize: contentLength ? `${contentLength}b` : undefined,
          responseSize: responseSize ? `${responseSize}b` : undefined,
          protocol: request.protocol,
          httpVersion: request.httpVersion,
        });
      }),
      catchError((error) => {
        const responseTime = Date.now() - startTime;
        const statusCode = error.status || 500;

        // Для ошибок используем logRequest + дополнительное логирование стека
        this.logger.logRequest(method, url, statusCode, responseTime, 'HTTP', {
          ip,
          userAgent: this.categorizeUserAgent(userAgent),
          errorName: error.name,
          errorMessage: error.message,
        });

        // Дополнительно логируем стек ошибки для серверных ошибок
        if (statusCode >= 500) {
          this.logger.logError(error, 'HTTP', {
            method,
            url,
            ip,
            responseTime: `${responseTime}ms`,
          });
        }

        throw error;
      }),
    );
  }

  private categorizeUserAgent(userAgent?: string): string {
    if (!userAgent) return 'Unknown';

    // Извлекаем основную информацию из User-Agent
    if (userAgent.includes('Postman')) return 'Postman';
    if (userAgent.includes('curl')) return 'curl';
    if (userAgent.includes('wget')) return 'wget';
    if (userAgent.includes('axios')) return 'axios';
    if (userAgent.includes('fetch')) return 'fetch';
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    if (userAgent.includes('bot')) return 'Bot';

    // Обрезаем длинные User-Agent строки
    return userAgent.length > 30 ? userAgent.substring(0, 30) + '...' : userAgent;
  }
}
