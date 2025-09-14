import { BadRequestException, ConflictException, Injectable, InternalServerErrorException, NotFoundException  } from '@nestjs/common';
import {OrderStatus} from '../entities/order.entity';
import {OrderRepository} from '../repositories/order.repository';
import {OrderResponseDto} from '../dto/order-response.dto';
import {OrderFilterDto} from '../dto/order-filter.dto';
import {ReserveBoxDto} from '../dto/reserve-box.dto';
import {CreateOrderDto} from '../dto/create-order.dto';
import {PaginatedResponseDto} from '@common/pagination/pagination.dto';
import {PaginationService} from '@common/pagination/pagination.service';
import {SurpriseBoxService} from "@surprise-box/services/surprise-box.service";
import {OrderMapper} from "@order/entities/order.mapper";
import {AppLogger} from '@common/logger/app-logger.service';

@Injectable()
export class OrderService {
  constructor(
    private readonly orderRepository: OrderRepository,
    private readonly surpriseBoxService: SurpriseBoxService,
    private readonly paginationService: PaginationService,
    private readonly logger: AppLogger,
  ) {}

  /**
   * Резервирование бокса для заказа
   */
  async reserveBox(reserveBoxDto: ReserveBoxDto): Promise<{ expiresAt: string | null }> {
    this.logger.log('Starting box reservation process', 'OrderService');
    const result = await this.surpriseBoxService.reserveBox(reserveBoxDto);

    if (!result.success) {
      this.logger.debug('Box reservation failed', 'OrderService', {
        boxId: reserveBoxDto.surpriseBoxId,
        customerId: reserveBoxDto.customerId,
        message: result.message
      });

      if (result.message === 'Box not found') {
        throw new NotFoundException('Box not found', {
          cause: result.message,
          description: `Box with ID ${reserveBoxDto.surpriseBoxId} does not exist`
        });
      } else {
        throw new ConflictException(result.message, {
          cause: result.message,
          description: `Box with ID ${reserveBoxDto.surpriseBoxId} is not available for reservation`
        });
      }
    }

    this.logger.log('Box reservation completed successfully', 'OrderService', {
      boxId: reserveBoxDto.surpriseBoxId,
      customerId: reserveBoxDto.customerId,
      expiresAt: result.data?.expiresAt
    });

    return result.data!;
  }

  async createOrder(createOrderDto: CreateOrderDto):
    Promise<{ orderId: number | null; pickupCode: string | null; }> {

    this.logger.log('Starting order creation process', 'OrderService', {
      customerId: createOrderDto.customerId,
      boxId: createOrderDto.boxId,
      storeId: createOrderDto.storeId
    });

    createOrderDto.estimatedDeliveryAt =
      createOrderDto.estimatedDeliveryAt ? new Date(createOrderDto.estimatedDeliveryAt) : undefined;

    const result = await this.orderRepository.create(createOrderDto);

    if (!result.success) {
      this.logger.debug('Order creation failed', 'OrderService', {
        customerId: createOrderDto.customerId,
        boxId: createOrderDto.boxId,
        message: result.message
      });

      if (OrderMapper.notFoundMessages.has(result.message)) {
        throw new NotFoundException(result.message, {
          cause: result.message,
          description: `${result.message} during order creation`,
        });
      }

      if (OrderMapper.badRequestMessages.has(result.message)) {
        throw new BadRequestException(result.message, {
          cause: result.message,
          description: 'Invalid order data provided',
        });
      }

      if (result.message === 'Unable to confirm order - box not reserved by this customer or reservation expired or box not from this store') {
        throw new ConflictException('Order confirmation failed', {
          cause: result.message,
          description: 'Box is not properly reserved for this customer or reservation has expired',
        });
      }

      throw new InternalServerErrorException('Failed to create order', {
        cause: result.message,
        description: 'An unexpected error occurred during order creation',
      });
    }

    this.logger.log('Order creation completed successfully', 'OrderService', {
      orderId: result.data?.orderId,
      hasPickupCode: !!result.data?.pickupCode
    });

    return result.data!;
  }

  async completeOrder(orderId: number, pickupCode: string, storeId: number): Promise<void> {
    this.logger.log('Starting order confirmation process', 'OrderService', {
      orderId, storeId, pickupCode });

    // Check that id and pickupCode are valid to one order
    const order = await this.orderRepository.findById(orderId);
    if (!order) throw new NotFoundException(`Order with id ${orderId} not found`);

    if (order.pickupCode !== pickupCode || order.storeId !== storeId) {
      this.logger.debug('Order confirmation failed due to invalid pickup code or store ID', 'OrderService', {
        orderId, storeId, pickupCode, expectedPickupCode: order.pickupCode, expectedStoreId: order.storeId
      });
      throw new BadRequestException('Invalid pickup code or store ID', {
        cause: 'Invalid pickup code or store ID',
        description: `Order ID: ${orderId}, Pickup Code: ${pickupCode}, Store ID: ${storeId}`
      });
    }

    // check that order is not already confirmed
    if (order.status === OrderStatus.COMPLETED || order.status === OrderStatus.CANCELLED || order.status === OrderStatus.REFUNDED) {
      this.logger.debug('Order confirmation failed due to invalid status', 'OrderService', {
        orderId, storeId, pickupCode, orderStatus: order.status
      });
      throw new ConflictException('Order is already completed or cancelled', {
        cause: 'Invalid order status',
        description: `Order status is ${order.status}, cannot be completed again. Order ID: ${orderId}, OrderStatus: ${order.status}`,
      });
    }

    const result = await this.orderRepository.completeOrder(orderId);
    if (!result.success) {
      this.logger.debug('Order confirmation failed', 'OrderService', {
        orderId, storeId, pickupCode, reason: result.message
      });

      throw new NotFoundException(result.message, {
        description: `An unexpected error occurred during order ${orderId} completion`
      });
    }

    this.logger.log('Order confirmation completed successfully', 'OrderService', {orderId});
  }

  async findOrderById(id: number): Promise<OrderResponseDto> {
    this.logger.log('Fetching order by ID', 'OrderService');

    const order = await this.orderRepository.findById(id);
    if (!order) {
      this.logger.debug('Order not found', 'OrderService', {orderId: id});
      throw new NotFoundException('Order not found');
    }

    this.logger.log('Order retrieved successfully', 'OrderService');
    return OrderMapper.toOrderResponseDto(order);
  }

  async findOrderByPickupCode(pickupCode: string, storeId: number): Promise<OrderResponseDto> {
    this.logger.log('Fetching order by pickup code', 'OrderService');

    const order = await this.orderRepository.findByPickupCode(pickupCode);
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
    return OrderMapper.toOrderResponseDto(order);
  }

  /**
   * Поиск заказов с фильтрами и пагинацией
   */
  async findOrdersWithFilters(filters: OrderFilterDto): Promise<PaginatedResponseDto<OrderResponseDto>> {
    this.logger.log('Fetching orders with filters', 'OrderService');

    const {orders, total, pagination} = await this.orderRepository.findWithFilters(filters);

    // Преобразуем заказы в DTO
    const ordersDto = orders.map(order => OrderMapper.toOrderResponseDto(order));

    // Извлекаем активные фильтры
    const activeFilters = this.paginationService.extractActiveFilters(filters);

    this.logger.log('Orders retrieved successfully', 'OrderService', {
      totalFound: total,
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

  async findOrdersByCustomer(customerId: number, page: number, limit: number):
    Promise<PaginatedResponseDto<OrderResponseDto>> {

    const filters = this.createOrderFilters(
      {customerId},
      page,
      limit,
      OrderService.DEFAULT_SORT_CONFIG
    );

    this.logger.log('Finding orders by customer', 'OrderService', {customerId, page, limit});

    return await this.findOrdersWithFilters(filters);
  }

  async findOrdersByStore(storeId: number, page: number, limit: number):
    Promise<PaginatedResponseDto<OrderResponseDto>> {

    const filters = this.createOrderFilters(
      {storeId},
      page,
      limit,
      OrderService.DEFAULT_SORT_CONFIG
    );

    this.logger.log('Finding orders by store', 'OrderService', {storeId, page, limit});

    return await this.findOrdersWithFilters(filters);
  }

  async getOrderHistoryByCustomer(customerId: number, page: number, limit: number):
    Promise<PaginatedResponseDto<OrderResponseDto>> {

    const filters = this.createOrderFilters(
      {customerId, statusIn: OrderService.FINALIZED_STATUSES},
      page,
      limit,
      OrderService.DEFAULT_SORT_CONFIG
    );
    this.logger.log('Fetching order history for customer', 'OrderService', {customerId, page, limit});

    return await this.findOrdersWithFilters(filters);
  }

  // Добавляем метод для получения активных заказов
  async getActiveOrdersByCustomer(customerId: number, page: number, limit: number):
    Promise<PaginatedResponseDto<OrderResponseDto>> {

    const filters = this.createOrderFilters(
      {customerId, statusNotIn: OrderService.FINALIZED_STATUSES},
      page,
      limit,
      OrderService.DEFAULT_SORT_CONFIG
    );
    this.logger.log('Fetching active orders for customer', 'OrderService', {customerId, page, limit});

    return await this.findOrdersWithFilters(filters);
  }

  // Метод для отмены заказа будет реализован в будущем
  async cancelOrder(): Promise<void> {
    this.logger.warn('Order cancellation method called but not implemented', 'OrderService');
    throw new BadRequestException('Method not implemented yet', {
      cause: 'Not implemented',
      description: 'Order cancellation functionality is not yet available'
    });
  }

  private static readonly DEFAULT_SORT_CONFIG = {
    sortBy: 'orderDate' as const,
    sortOrder: 'DESC' as const
  };

  private static readonly FINALIZED_STATUSES = [
    OrderStatus.COMPLETED,
    OrderStatus.CANCELLED,
    OrderStatus.REFUNDED
  ];

  private createOrderFilters(
    baseFilters: Partial<OrderFilterDto>,
    page: number,
    limit: number,
    sortConfig = OrderService.DEFAULT_SORT_CONFIG
  ): OrderFilterDto {
    return {
      ...baseFilters,
      page,
      limit,
      ...sortConfig
    };
  }
}
