import { Injectable } from '@nestjs/common';
import { PaginatedResponseDto } from './pagination.dto';

@Injectable()
export class PaginationService {

  /**
   * Создает пагинированный ответ
   */
  createPaginatedResponse<T>(
    data: T[],
    total: number,
    page: number,
    limit: number,
    sortBy?: string,
    sortOrder?: 'ASC' | 'DESC',
    filters?: Record<string, any>
  ): PaginatedResponseDto<T> {
    return new PaginatedResponseDto(
      data,
      total,
      page,
      limit,
      sortBy,
      sortOrder,
      filters
    );
  }

  /**
   * Валидирует параметры пагинации
   */
  validatePaginationParams(page?: number, limit?: number): { page: number; limit: number } {
    const validatedPage = Math.max(1, page || 1);
    const validatedLimit = Math.min(100, Math.max(1, limit || 10));

    return { page: validatedPage, limit: validatedLimit };
  }

  /**
   * Подготавливает параметры для skip и take
   */
  preparePaginationParams(page: number, limit: number): { skip: number; take: number } {
    const { page: validPage, limit: validLimit } = this.validatePaginationParams(page, limit);

    return {
      skip: (validPage - 1) * validLimit,
      take: validLimit
    };
  }

  /**
   * Извлекает активные фильтры из объекта фильтров
   */
  extractActiveFilters(filters: Record<string, any>): Record<string, any> {
    const activeFilters: Record<string, any> = {};

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        // Исключаем параметры пагинации из активных фильтров
        if (!['page', 'limit', 'sortBy', 'sortOrder'].includes(key)) {
          activeFilters[key] = value;
        }
      }
    });

    return activeFilters;
  }
}
