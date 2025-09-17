import { Injectable, NotFoundException, BadRequestException, ConflictException, InternalServerErrorException, HttpException } from '@nestjs/common';
import { AppLogger } from '@common/logger/app-logger.service';

/**
 * Интерфейс для стратегии обработки ошибок
 */
interface ErrorStrategy {
  canHandle(message: string): boolean;
  createException(message: string, context?: any): HttpException;
}

/**
 * Стратегия для ошибок "не найдено"
 */
class NotFoundErrorStrategy implements ErrorStrategy {
  canHandle(message: string): boolean {
    const notFoundPatterns = [
      'not found',
      'does not exist',
      'customer not found',
      'store not found',
      'box not found',
      'order not found'
    ];

    return notFoundPatterns.some(pattern =>
      message.toLowerCase().includes(pattern.toLowerCase())
    );
  }

  createException(message: string, context?: any): HttpException {
    return new NotFoundException(message, {
      cause: message,
      description: context?.description || `${message} during operation`,
    });
  }
}

/**
 * Стратегия для ошибок валидации
 */
class BadRequestErrorStrategy implements ErrorStrategy {
  canHandle(message: string): boolean {
    const badRequestPatterns = [
      'invalid amount',
      'must be positive',
      'required parameters',
      'delivery address is required',
      'prices must be greater than',
      'discounted price cannot be greater',
      'pickup start time must be before',
      'sale start time must be before',
      'pickup start time cannot be before',
      'pickup end time cannot be after',
      'cannot be null or empty'
    ];

    return badRequestPatterns.some(pattern =>
      message.toLowerCase().includes(pattern.toLowerCase())
    );
  }

  createException(message: string, context?: any): HttpException {
    return new BadRequestException(message, {
      cause: message,
      description: context?.description || 'Invalid request data provided',
    });
  }
}

/**
 * Стратегия для конфликтов
 */
class ConflictErrorStrategy implements ErrorStrategy {
  canHandle(message: string): boolean {
    const conflictPatterns = [
      'not reserved',
      'reservation expired',
      'unable to confirm',
      'box not from this store',
      'already exists',
      'not available for reservation'
    ];

    return conflictPatterns.some(pattern =>
      message.toLowerCase().includes(pattern.toLowerCase())
    );
  }

  createException(message: string, context?: any): HttpException {
    return new ConflictException(message, {
      cause: message,
      description: context?.description || 'Resource conflict occurred',
    });
  }
}

/**
 * Контекст для обработки ошибок
 */
interface ErrorContext {
  operation?: string;
  resourceId?: number | string;
  userId?: number;
  description?: string;
  additionalData?: any;
}

/**
 * Сервис для централизованной обработки ошибок
 * Использует паттерн Strategy для различных типов ошибок
 */
@Injectable()
export class OrderErrorHandlerService {
  private readonly strategies: ErrorStrategy[] = [
    new NotFoundErrorStrategy(),
    new BadRequestErrorStrategy(),
    new ConflictErrorStrategy(),
  ];

  constructor(private readonly logger: AppLogger) {}

  /**
   * Основной метод для обработки ошибок репозитория
   * @param message - сообщение об ошибке
   * @param stackTrace
   * @param context - контекст операции
   */
  handleRepositoryError(message: string, stackTrace: string, context?: ErrorContext): never {
    // Логируем ошибку с контекстом
    this.logError(message, stackTrace, context);

    // Ищем подходящую стратегию
    const strategy = this.strategies.find(s => s.canHandle(message));

    if (strategy) {
      throw strategy.createException(message, context);
    }

    // Fallback для неизвестных ошибок
    throw new InternalServerErrorException('An unexpected error occurred', {
      cause: message,
      description: context?.description || 'Internal server error during operation',
    });
  }

  /**
   * Специализированный метод для ошибок создания заказа
   */
  handleOrderCreationError(message: string, orderData: any, stackTrace: string | undefined): never {
    const context: ErrorContext = {
      operation: 'order_creation',
      resourceId: orderData.boxId,
      userId: orderData.customerId,
      description: 'Error occurred during order creation process',
      additionalData: {
        storeId: orderData.storeId,
        paymentType: orderData.paymentType
      }
    };

    stackTrace = stackTrace ? stackTrace : 'No stack trace available';

    this.handleRepositoryError(message, stackTrace, context);
  }

  /**
   * Специализированный метод для ошибок резервации
   */
  handleReservationError(message: string, reservationData: any, stackTrace: string | undefined): never {
    const context: ErrorContext = {
      operation: 'box_reservation',
      resourceId: reservationData.surpriseBoxId,
      userId: reservationData.customerId,
      description: 'Error occurred during box reservation process'
    };

    stackTrace = stackTrace ? stackTrace : 'No stack trace available';

    this.handleRepositoryError(message, stackTrace,  context);
  }

  /**
   * Специализированный метод для ошибок поиска
   */
  handleSearchError(message: string, searchParams: any, stackTrace: string | undefined): never {
    const context: ErrorContext = {
      operation: 'order_search',
      resourceId: searchParams.orderId || searchParams.customerId,
      description: 'Error occurred during order search operation',
      additionalData: searchParams
    };

    stackTrace = stackTrace ? stackTrace : 'No stack trace available';
    this.handleRepositoryError(message, stackTrace, context);
  }

  /**
   * Проверяет, является ли ошибка критической
   */
  isCriticalError(message: string): boolean {
    const criticalPatterns = [
      'database connection',
      'timeout',
      'internal error',
      'system error'
    ];

    return criticalPatterns.some(pattern =>
      message.toLowerCase().includes(pattern.toLowerCase())
    );
  }

  /**
   * Создает стандартизированное сообщение об ошибке для пользователя
   */
  createUserFriendlyMessage(message: string): string {
    const friendlyMessages: Record<string, string> = {
      'Box not found': 'The selected surprise box is no longer available',
      'Customer not found': 'Customer account not found',
      'Store not found': 'Store information is not available',
      'Invalid amount': 'The provided amount is invalid',
      'Unable to confirm order': 'Unable to process your order at this time'
    };

    return friendlyMessages[message] || 'An error occurred while processing your request';
  }

  /**
   * Логирует ошибку с контекстом
   */
  private logError(message: string, stackTrace: string, context?: ErrorContext): void {
    const logContext = {
      errorMessage: message,
      operation: context?.operation,
      resourceId: context?.resourceId,
      userId: context?.userId,
      additionalData: context?.additionalData
    };

    if (this.isCriticalError(message)) {
      this.logger.error('Critical error occurred', 'OrderErrorHandlerService', stackTrace, logContext);
    } else {
      this.logger.debug('Error handled by error service', 'OrderErrorHandlerService', logContext);
    }
  }

  /**
   * Добавляет новую стратегию обработки ошибок
   */
  addStrategy(strategy: ErrorStrategy): void {
    this.strategies.push(strategy);
  }

  /**
   * Получает статистику обработанных ошибок (для мониторинга)
   */
  getErrorStats(): { [key: string]: number } {
    // В реальном приложении здесь может быть логика подсчета статистики
    return {
      notFound: 0,
      badRequest: 0,
      conflict: 0,
      internal: 0
    };
  }
}
