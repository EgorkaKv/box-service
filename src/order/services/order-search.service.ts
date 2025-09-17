import { Injectable } from '@nestjs/common';
import { PaginationService } from '@common/pagination/pagination.service';
import { AppLogger } from '@common/logger/app-logger.service';
import { Order } from '../entities/order.entity';
import { OrderFilterDto } from '../dto/order-filter.dto';
import { PaginationInfo } from '@common/pagination/pagination.service';
import {OrderRepository} from "@order/repositories/order.repository";
import {FindOptionsWhere} from "typeorm";

interface EnrichedOrderFilterDto extends OrderFilterDto {
  customerId?: number;
  storeId?: number;
}

/**
 * Сервис для поиска заказов
 * координирует построение запросов и пагинацию
 */
@Injectable()
export class OrderSearchService {
  constructor(
    private readonly repository: OrderRepository,
    private readonly paginationService: PaginationService,
    private readonly logger: AppLogger,
  ) {}

  /**
   * Поиск заказа по ID с возможностью загрузки связей
   * @param param - параметры поиска (orderId или pickupCode)
   * @returns найденный заказ или null
   */
  async findOrderByParam(param: { orderId?: number; pickupCode?: string }): Promise<Order | null> {
    this.logger.debug('Finding order by parameters', 'OrderSearchService', { param });
    if (param.orderId) {
      return this.repository.findOneBy({ id: param.orderId });
    }
    if (param.pickupCode) {
      return this.repository.findOneBy({ pickupCode: param.pickupCode });
    }
    return null;
  }

  /**
   * Поиск заказов с фильтрами и пагинацией
   * Обновленная версия с поддержкой контекстных параметров
   */
  async findOrdersWithFilters(
    filters: OrderFilterDto,
    context?: { customerId?: number; storeId?: number }
  ): Promise<{orders: Order[]; pagination: PaginationInfo}> {

    // Обогащаем фильтры контекстными данными из JWT
    const enrichedFilters: EnrichedOrderFilterDto = {
      ...filters,
      ...(context?.customerId && { customerId: context.customerId }),
      ...(context?.storeId && { storeId: context.storeId })
    };

    this.logger.debug('Searching orders with enriched filters', 'OrderSearchService', {
      originalFilters: Object.keys(filters).length,
      enrichedFilters: Object.keys(enrichedFilters).length,
      context
    });

    // Создаем запрос с фильтрами
    const queryBuilder = this.buildFilteredQuery(enrichedFilters);

    const { page: validatedPage, limit: validatedLimit } =
      this.paginationService.validatePaginationParams(filters.page, filters.limit);
    const { skip, take } =
      this.paginationService.preparePaginationParams(validatedPage, validatedLimit);

    queryBuilder.skip(skip).take(take);

    const [orders, total] = await this.repository.executeQueryWithCount(queryBuilder);

    const pagination: PaginationInfo = {
      page: validatedPage,
      limit: validatedLimit,
      total,
    };

    this.logger.debug('Search query executed', 'OrderSearchService', {
      rowsReturned: orders.length,
      totalFound: total,
      page: pagination.page,
    });

    this.logger.debug('Order search completed', 'OrderSearchService', {
      totalFound: pagination.total,
      returnedCount: orders.length
    });

    return {orders, pagination};
  }


  /**
   * Построение запроса с фильтрами
   */
  private buildFilteredQuery(filters: EnrichedOrderFilterDto) {
    const queryBuilder = this.repository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.customer', 'customer')
      .leftJoinAndSelect('order.surpriseBox', 'surpriseBox')
      .leftJoinAndSelect('order.store', 'store')
      .leftJoinAndSelect('order.delivery', 'delivery')
      .leftJoinAndSelect('order.payment', 'payment');

    // Применяем фильтры
    this.applyFilters(queryBuilder, filters);

    // Применяем сортировку
    this.applySorting(queryBuilder, filters);

    return queryBuilder;
  }

  /**
   * Применение фильтров к запросу
   */
  private applyFilters(queryBuilder: any, filters: EnrichedOrderFilterDto): void {
    if (filters.customerId) {
      queryBuilder.andWhere('order.customerId = :customerId', { customerId: filters.customerId });
    }

    if (filters.storeId) {
      queryBuilder.andWhere('order.storeId = :storeId', { storeId: filters.storeId });
    }

    if (filters.status) {
      queryBuilder.andWhere('order.status = :status', { status: filters.status });
    }

    if (filters.statusIn && filters.statusIn.length > 0) {
      queryBuilder.andWhere('order.status IN (:...statusIn)', { statusIn: filters.statusIn });
    }

    if (filters.statusNotIn && filters.statusNotIn.length > 0) {
      queryBuilder.andWhere('order.status NOT IN (:...statusNotIn)', { statusNotIn: filters.statusNotIn });
    }

    if (filters.paymentType) {
      queryBuilder.andWhere('order.paymentType = :paymentType', { paymentType: filters.paymentType });
    }

    if (filters.fulfillmentType) {
      queryBuilder.andWhere('order.fulfillmentType = :fulfillmentType', { fulfillmentType: filters.fulfillmentType });
    }

    if (filters.orderDateFrom) {
      queryBuilder.andWhere('order.orderDate >= :orderDateFrom', { orderDateFrom: filters.orderDateFrom });
    }

    if (filters.orderDateTo) {
      queryBuilder.andWhere('order.orderDate <= :orderDateTo', { orderDateTo: filters.orderDateTo });
    }
  }

  /**
   * Применение сортировки
   */
  private applySorting(queryBuilder: any, filters: OrderFilterDto): void {
    const sortBy = filters.sortBy || 'orderDate';
    const sortOrder = filters.sortOrder || 'DESC';

    const sortFieldMap = {
      'id': 'order.id',
      'status': 'order.status',
      'orderDate': 'order.orderDate',
    };

    const sortField = sortFieldMap[sortBy] || 'order.orderDate';
    queryBuilder.orderBy(sortField, sortOrder);
  }

  }

