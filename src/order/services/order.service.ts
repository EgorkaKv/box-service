import { BadRequestException, ConflictException, Injectable, InternalServerErrorException, NotFoundException  } from '@nestjs/common';
import {OrderRepository} from '../repositories/order.repository';
import {OrderResponseDto} from '../dto/order-response.dto';
import {OrderFilterDto} from '../dto/order-filter.dto';
import {ReserveBoxDto} from '../dto/reserve-box.dto';
import {CreateOrderDto} from '../dto/create-order.dto';
import {PaginatedResponseDto} from '@common/pagination/pagination.dto';
import {PaginationService} from '@common/pagination/pagination.service';
import {SurpriseBoxService} from "@surprise-box/services/surprise-box.service";
import {OrderMapper} from "@order/mappers/order.mapper";
import {AppLogger} from '@common/logger/app-logger.service';
import {OrderSearchService} from "@order/services/order-search.service";
import {OrderErrorHandlerService} from "@order/services/order-error-handler.service";

@Injectable()
export class OrderService {
  constructor(
    private readonly orderRepository: OrderRepository,
    private readonly surpriseBoxService: SurpriseBoxService,
    private readonly paginationService: PaginationService,
    private readonly searchService: OrderSearchService,
    private readonly errorHandler: OrderErrorHandlerService,
    private readonly mapper: OrderMapper,
    private readonly logger: AppLogger,
  ) {}

  /**
   * Резервирование бокса для заказа
   */
  async reserveBox(reserveBoxDto: ReserveBoxDto, customerId: number): Promise<{ expiresAt: string | null }> {
    this.logger.log('Starting box reservation process', 'OrderService');
    const result = await this.surpriseBoxService.reserveBox(reserveBoxDto, customerId);

    if (!result.success) {
      this.logger.debug('Box reservation failed', 'OrderService', {
        boxId: reserveBoxDto.surpriseBoxId,
        customerId: customerId,
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
      customerId: customerId,
      expiresAt: result.data?.expiresAt
    });

    return result.data!;
  }

  /**
   * Создание заказа с проверками и обработкой ошибок
   * @param createOrderDto
   */
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

      this.errorHandler.handleOrderCreationError(result.message, createOrderDto, new Error().stack);
      }

    this.logger.log('Order creation completed successfully', 'OrderService', {
      orderId: result.data?.orderId,
      hasPickupCode: !!result.data?.pickupCode
    });

    return result.data!;
  }

  /**
   * Поиск заказа по ID с обработкой ошибок
   * @param orderId
   */
  async findOrderById(orderId: number): Promise<OrderResponseDto> {
    this.logger.log('Fetching order by ID', 'OrderService');

    const order = await this.searchService.findOrderByParam({orderId});
    if (!order) {
      this.logger.debug('Order not found', 'OrderService', {orderId});
      throw new NotFoundException('Order not found');
    }

    this.logger.log('Order retrieved successfully', 'OrderService');
    return this.mapper.toDto(order);
  }

  /**
   * Поиск заказов клиента с фильтрами и пагинацией
   * @param customerId
   * @param filters
   */
  async findOrdersByCustomer(customerId: number, filters: OrderFilterDto):
    Promise<PaginatedResponseDto<OrderResponseDto>> {

    this.logger.log('Finding orders by customer', 'OrderService', {customerId});

    const {orders, pagination} = await this.searchService.findOrdersWithFilters(filters, {customerId});

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

  // Метод для отмены заказа будет реализован в будущем
  async cancelOrder(): Promise<void> {
    this.logger.warn('Order cancellation method called but not implemented', 'OrderService');
    throw new BadRequestException('Method not implemented yet', {
      cause: 'Not implemented',
      description: 'Order cancellation functionality is not yet available'
    });
  }
}
