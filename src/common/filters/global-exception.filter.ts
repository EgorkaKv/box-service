import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { AppLogger } from '../logger/app-logger.service';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  constructor(private readonly logger: AppLogger) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal Server Error';
    let errorCode = 'INTERNAL_ERROR';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const errorResponse = exception.getResponse();

      if (typeof errorResponse === 'string') {
        message = errorResponse;
      } else if (typeof errorResponse === 'object' && errorResponse !== null) {
        message = (errorResponse as any).message || exception.message;
        errorCode = (errorResponse as any).error || 'HTTP_EXCEPTION';
      }
    } else if (exception instanceof Error) {
      message = exception.message;
      errorCode = exception.name;
    }

    // Определяем уровень логирования в зависимости от статуса
    const logLevel = status >= 500 ? 'error' : 'warn';

    // Логируем исключение с контекстом
    const errorMetadata = {
      method: request.method,
      url: request.url,
      statusCode: status,
      errorCode,
      userAgent: request.get('User-Agent'),
      ip: request.ip || request.connection.remoteAddress,
      timestamp: new Date().toISOString(),
    };

    if (logLevel === 'error') {
      this.logger.logError(
        exception instanceof Error ? exception : new Error(message),
        'GlobalExceptionFilter',
        errorMetadata
      );
    } else {
      this.logger.warn(`HTTP ${status}: ${message}`, 'GlobalExceptionFilter');
    }

    // Формируем ответ клиенту
    const errorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message,
      error: errorCode,
    };

    response.status(status).json(errorResponse);
  }
}
