import { Injectable } from '@nestjs/common';
import { SurpriseBoxRepository } from '../repositories/surprise-box.repository';
import { SurpriseBoxQueryBuilderService } from './surprise-box-query-builder.service';
import { PaginationService } from '@common/pagination/pagination.service';
import { AppLogger } from '@common/logger/app-logger.service';
import { SurpriseBox } from '../entities/surprise-box.entity';
import { BaseSurpriseBoxFiltersDto } from '../dto/get-surprise-boxes-filters.dto';
import { EmployeeBoxFiltersDto } from '../dto/employee-box-filters.dto';
import { PaginationInfo } from '@common/pagination/pagination.service';

/**
 * Сервис поиска - координирует работу QueryBuilder и Repository
 * содержит бизнес-логику пагинации и логирования
 */
@Injectable()
export class SurpriseBoxSearchService {
  constructor(
    private readonly repository: SurpriseBoxRepository,
    private readonly queryBuilderService: SurpriseBoxQueryBuilderService,
    private readonly paginationService: PaginationService,
    private readonly logger: AppLogger,
  ) {}

  /**
   * Поиск боксов для клиентов с пагинацией
   */
  async findBoxesForCustomers(
    filters: BaseSurpriseBoxFiltersDto
  ): Promise<{boxes: SurpriseBox[]; pagination: PaginationInfo}> {

    this.logger.debug('Searching boxes for customers', 'SurpriseBoxSearchService', {
      filtersType: this.getFiltersType(filters),
      page: filters.page,
      limit: filters.limit
    });

    // Создаем запрос через QueryBuilder
    const queryBuilder = this.queryBuilderService.createCustomerQuery(
      this.repository.createQueryBuilder(),
      filters
    );

    // Выполняем поиск с пагинацией
    const result = await this.executeSearchWithPagination(
      queryBuilder,
      filters.page,
      filters.limit,
      { context: 'customer_search' }
    );

    this.logger.debug('Customer search completed', 'SurpriseBoxSearchService', {
      totalFound: result.pagination.total,
      returnedCount: result.boxes.length
    });

    return result;
  }

  /**
   * Поиск боксов для работников с пагинацией
   */
  async findBoxesForEmployees(
    storeId: number,
    filters: EmployeeBoxFiltersDto
  ): Promise<{boxes: SurpriseBox[]; pagination: PaginationInfo}> {

    this.logger.debug('Searching boxes for employees', 'SurpriseBoxSearchService', {
      storeId,
      page: filters.page,
      limit: filters.limit
    });

    // Создаем запрос через QueryBuilder
    const queryBuilder = this.queryBuilderService.createEmployeeQuery(
      this.repository.createQueryBuilder(),
      storeId,
      filters
    );

    // Выполняем поиск с пагинацией
    const result = await this.executeSearchWithPagination(
      queryBuilder,
      filters.page,
      filters.limit,
      { context: 'employee_search', storeId }
    );

    this.logger.debug('Employee search completed', 'SurpriseBoxSearchService', {
      storeId,
      totalFound: result.pagination.total,
      returnedCount: result.boxes.length
    });

    return result;
  }

  /**
   * Универсальный метод выполнения поиска с пагинацией
   */
  private async executeSearchWithPagination(
    queryBuilder: any,
    page?: number,
    limit?: number,
    contextInfo?: Record<string, any>
  ): Promise<{boxes: SurpriseBox[]; pagination: PaginationInfo}> {

    // Валидация и подготовка пагинации
    const { page: validatedPage, limit: validatedLimit } =
      this.paginationService.validatePaginationParams(page, limit);
    const { skip, take } =
      this.paginationService.preparePaginationParams(validatedPage, validatedLimit);

    // Применяем пагинацию к запросу
    queryBuilder.skip(skip).take(take);

    // Выполняем запрос через репозиторий
    const [boxes, total] = await this.repository.executeQueryWithCount(queryBuilder);

    // Создаем объект пагинации
    const pagination: PaginationInfo = {
      page: validatedPage,
      limit: validatedLimit,
      total,
    };

    this.logger.debug('Search query executed', 'SurpriseBoxSearchService', {
      rowsReturned: boxes.length,
      totalFound: total,
      page: pagination.page,
      ...contextInfo
    });

    return { boxes, pagination };
  }

  /**
   * Получить тип фильтров для логирования
   */
  private getFiltersType(filters: BaseSurpriseBoxFiltersDto): string {
    if ('latitude' in filters && 'longitude' in filters) return 'nearby';
    if ('storeId' in filters) return 'store';
    if ('cityId' in filters) return 'city';
    return 'base';
  }
}
