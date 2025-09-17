import { BadRequestException, ConflictException, Injectable, InternalServerErrorException, NotFoundException  } from '@nestjs/common';
import {OrderStatus} from '../entities/order.entity';
import {OrderRepository} from '../repositories/order.repository';
import {OrderResponseDto} from '../dto/order-response.dto';
import {OrderFilterDto} from '../dto/order-filter.dto';
import {PaginatedResponseDto} from '@common/pagination/pagination.dto';
import {PaginationService} from '@common/pagination/pagination.service';
import {OrderMapper} from "@order/mappers/order.mapper";
import {AppLogger} from '@common/logger/app-logger.service';
import {OrderSearchService} from "@order/services/order-search.service";
import {BoxStatus} from "@surprise-box/entities/surprise-box.entity";

@Injectable()
export class EmployeeOrderService {
  constructor(
    private readonly orderRepository: OrderRepository,
    private readonly paginationService: PaginationService,
    private readonly searchService: OrderSearchService,
    private readonly mapper: OrderMapper,
    private readonly logger: AppLogger,
  ) {}

  /**
   * Завершение заказа с проверками
   * @param orderId
   * @param pickupCode
   * @param storeId
   */
  async completeOrder(orderId: number, pickupCode: string, storeId: number): Promise<void> {
    this.logger.log('Starting order confirmation process', 'OrderService', {
      orderId, storeId, pickupCode });

    await this.orderRepository.completeTransaction(async (manager) => {
      // Загружаем заказ вместе с коробкой
      const order = await this.orderRepository.findOrderWithBox(manager, orderId);

      if (!order) {
        throw new NotFoundException(`Order with id ${orderId} not found`);
      }

      if (order.pickupCode !== pickupCode) {
        this.logger.warn('Invalid pickup code attempt', 'OrderCompletionService', {
          orderId,
          providedCode: pickupCode,
          expectedCode: order.pickupCode,
        });
        throw new BadRequestException('Invalid pickup code');
      }

      if (order.storeId !== storeId) {
        this.logger.warn('Store ID mismatch attempt', 'OrderCompletionService', {
          orderId,
          providedStoreId: storeId,
          expectedStoreId: order.storeId,
        });
        throw new BadRequestException('Order does not belong to this store');
      }

      if (this.isOrderFinalized(order.status)) {
        throw new ConflictException(`Order is already ${order.status.toLowerCase()}`);
      }

      if (!order.surpriseBox) {
        throw new BadRequestException('Order has no SurpriseBox attached');
      }

      // Обновляем статусы
      order.status = OrderStatus.COMPLETED;
      order.pickupedAt = new Date();
      order.surpriseBox.status = BoxStatus.SOLD;

      await this.orderRepository.saveOrder(manager, order);
      await this.orderRepository.saveBox(manager, order.surpriseBox);

      return { success: true, message: 'Order and SurpriseBox statuses updated' };
    });

    this.logger.log('Order confirmation completed successfully', 'OrderService', {orderId});
  }

  /**
   * Поиск заказов с фильтрами и пагинацией
   * @param pickupCode
   * @param storeId
   */
  async findOrderByPickupCode(pickupCode: string, storeId: number): Promise<OrderResponseDto> {
    this.logger.log('Fetching order by pickup code', 'OrderService');

    const order = await this.searchService.findOrderByParam({pickupCode});
    if (!order) {
      this.logger.debug('Order not found by pickup code', 'OrderService', {pickupCode});
      throw new NotFoundException('Order not found', {description: `Order with pickup code ${pickupCode} does not exist`});
    }
    if ( order.storeId !== storeId) {
      this.logger.debug('Order with pickup code found but store ID does not match', 'OrderService', {
        orderId: order.id, pickupCode, storeId, expectedStoreId: order.storeId
      })
      throw new BadRequestException('Order not found for this store', {
        cause: 'Store ID mismatch',
        description: `Order with pickup code ${pickupCode} is not from store with ID ${storeId}`
      });
    }

    this.logger.log('Order retrieved by pickup code successfully', 'OrderService');
    return this.mapper.toDto(order);
  }

  /**
   * Создание заказа с резервированием коробки
   * @param storeId
   * @param filters
   */
  async findOrdersByStore(storeId: number, filters: OrderFilterDto):
    Promise<PaginatedResponseDto<OrderResponseDto>> {

    this.logger.log('Finding orders by store', 'OrderService', {storeId});

    const {orders, pagination} = await this.searchService.findOrdersWithFilters(filters, {storeId});

    // Преобразуем заказы в DTO
    const ordersDto = orders.map(order => this.mapper.toDto(order));

    // Извлекаем активные фильтры
    const activeFilters = this.paginationService.extractActiveFilters(filters);

    this.logger.log('Orders retrieved successfully', 'OrderService', {
      totalFound: pagination.total,
      returnedCount: ordersDto.length
    });

    // Создаем пагинированный ответ
    return this.paginationService.createPaginatedResponse(
      ordersDto,
      pagination,
      filters.sortBy,
      filters.sortOrder,
      activeFilters
    );
  }

  /**
   * Проверка, является ли заказ финализированным
   */
  private isOrderFinalized(status: OrderStatus): boolean {
    const finalizedStatuses = [
      OrderStatus.COMPLETED,
      OrderStatus.CANCELLED,
      OrderStatus.REFUNDED
    ];
    return finalizedStatuses.includes(status);
  }
}