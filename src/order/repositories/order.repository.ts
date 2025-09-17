import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {EntityManager, FindOptionsWhere, Repository, SelectQueryBuilder} from 'typeorm';
import { Order, OrderStatus } from '../entities/order.entity';
import { OrderFilterDto } from '../dto/order-filter.dto';
import { CreateOrderDto } from "@order/dto/create-order.dto";
import { PaginationService } from '@common/pagination/pagination.service';
import {BaseOperationResult, OperationResult} from "@common/interfaces/operation-result.interface";
import {BoxStatus, SurpriseBox} from "@surprise-box/entities/surprise-box.entity";
import { AppLogger } from '@common/logger/app-logger.service';
import {operationResultHelper} from "@common/interfaces/operation-result.helper";

@Injectable()
export class OrderRepository {
  constructor(
    @InjectRepository(Order)
    private readonly repository: Repository<Order>,
    private readonly logger: AppLogger,
  ) {}

  /**
   * Создать QueryBuilder для сложных запросов
   */
  createQueryBuilder(alias: string = 'order') {
    return this.repository.createQueryBuilder(alias);
  }

  /**
   * Выполнить запрос с подсчетом
   */
  async executeQueryWithCount(queryBuilder: SelectQueryBuilder<Order>): Promise<[Order[], number]> {
    return queryBuilder.getManyAndCount();
  }

  /**
   * Найти заказы по простым условиям
   * @param conditions
   * @param relations
   */
  async findOneBy(conditions: FindOptionsWhere<Order>, relations: string[] = []): Promise<Order | null> {
    return this.repository.findOne({
      where: conditions,
      relations,
    });
  }

  /**
   * Создание заказа через хранимую процедуру confirm_box_order
   * @param createOrderDto
   */
  async create(createOrderDto: CreateOrderDto):
    Promise<OperationResult<{ orderId: number | null; pickupCode: string | null; }>> {

    this.logger.debug('Executing confirm_box_order function', 'OrderRepository', {
      customerId: createOrderDto.customerId,
      boxId: createOrderDto.boxId,
      storeId: createOrderDto.storeId,
      paymentMethod: createOrderDto.paymentMethod,
      amount: createOrderDto.amount
    });

    const result = await this.repository.query(
      `SELECT * FROM confirm_box_order(
        $1, $2, $3, $4::PAYMENT_TYPE, $5::FULFILLMENT_TYPE, $6::PAYMENT_METHOD, $7, $8, $9, $10, $11, $12, $13
      )`,
      [
        createOrderDto.boxId,
        createOrderDto.customerId,
        createOrderDto.storeId,
        createOrderDto.paymentType,
        createOrderDto.fulfillmentType,
        createOrderDto.paymentMethod,
        createOrderDto.amount,
        createOrderDto.transactionId || null,
        createOrderDto.paymentGateway || null,
        createOrderDto.deliveryAddress || null,
        createOrderDto.deliveryService || null,
        createOrderDto.estimatedDeliveryAt || null,
        createOrderDto.trackingCode || null,
      ]
    );

    const queryResult = operationResultHelper<{
      orderId: number | null;
      pickupCode: string | null;
    }>(result[0]);

    this.logger.debug('Database function executed', 'OrderRepository', {
      success: queryResult.success,
      orderId: queryResult.data?.orderId,
      hasPickupCode: !!queryResult.data?.pickupCode
    });

    return queryResult;
  }

  async completeTransaction<T>(work: (manager: EntityManager) => Promise<T>): Promise<T> {
    return this.repository.manager.transaction(work);
  }

  async findOrderWithBox(manager: EntityManager, id: number): Promise<Order | null> {
    return manager.findOne(Order, { where: { id }, relations: ['surpriseBox'] });
  }

  async saveOrder(manager: EntityManager, order: Order): Promise<Order> {
    return manager.save(order);
  }

  async saveBox(manager: EntityManager, box: SurpriseBox): Promise<SurpriseBox> {
    return manager.save(box);
  }


  /*  /!**
     * Найти заказ по ID с опциональными связями
     * @param id
     *!/
    async findById(id: number): Promise<Order | null> {
      this.logger.debug('Finding order by ID', 'OrderRepository', { orderId: id });

      const order = await this.repository.findOne({
        where: { id },
        relations: ['customer', 'surpriseBox', 'store', 'delivery', 'payment'],
      });

      this.logger.debug('Order search completed', 'OrderRepository', {
        orderId: id,
        found: !!order,
        status: order?.status
      });

      return order;
    }*/

/*  async findByPickupCode(pickupCode: string): Promise<Order | null> {
    this.logger.debug('Finding order by pickup code', 'OrderRepository', { pickupCode });

    const order = await this.repository.findOne({
      where: { pickupCode },
      relations: ['customer', 'surpriseBox', 'store', 'delivery', 'payment'],
    });

    this.logger.debug('Order search by pickup code completed', 'OrderRepository', {
      pickupCode,
      found: !!order,
      orderId: order?.id
    });

    return order;
  }*/

  /*async findWithFilters(filters: OrderFilterDto):
    Promise<{ orders: Order[]; total: number; pagination: any }> {
    this.logger.debug('Finding orders with filters in database', 'OrderRepository', {
      customerId: filters.customerId, storeId: filters.storeId,
      status: filters.status, statusIn: filters.statusIn,
      statusNotIn: filters.statusNotIn, page: filters.page,
      limit: filters.limit
    });

    const queryBuilder = this.createFilteredQuery(filters);
    const { page, limit } = this.paginationService.validatePaginationParams(filters.page, filters.limit);
    const { skip, take } = this.paginationService.preparePaginationParams(page, limit);
    this.logger.debug('Pagination parameters prepared', 'OrderRepository', {
      page, limit, skip, take})

    const [orders, total] = await queryBuilder
      .skip(skip)
      .take(take)
      .getManyAndCount();
    this.logger.debug('Orders retrieved from database', 'OrderRepository', {
      rowsReturned: orders.length, totalFound: total });

    const totalPages = Math.ceil(total / limit);
    const pagination = {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    };

    this.logger.debug('Query executed with pagination', 'OrderRepository', {
      rowsReturned: orders.length,
      totalFound: total,
      page: pagination.page,
      totalPages: pagination.totalPages
    });

    return { orders, total, pagination };
  }*/

  /*async completeOrder(id: number): Promise<BaseOperationResult> {
    this.logger.debug('Completing order transaction', 'OrderRepository', { orderId: id });

    return await this.repository.manager.transaction(async (manager: EntityManager) => {
      const order = await manager.findOne(Order, {
        where: { id },
        relations: ['surpriseBox'],
      });

      if (!order || !order.surpriseBox) {
        this.logger.debug('Order or SurpriseBox not found in transaction', 'OrderRepository', {
          orderId: id,
          orderExists: !!order,
          surpriseBoxExists: !!order?.surpriseBox
        });
        return { success: false, message: 'Order or SurpriseBox not found' };
      }

      order.status = OrderStatus.COMPLETED;
      this.logger.debug('order status updated in transaction', 'OrderRepository')
      order.pickupedAt = new Date();
      this.logger.debug('order pickup time was set in transaction', 'OrderRepository')
      order.surpriseBox.status = BoxStatus.SOLD;
      this.logger.debug('SurpriseBox status updated in transaction', 'OrderRepository')

      await manager.save(order);
      this.logger.debug('Order saved in transaction', 'OrderRepository', { orderId: id });
      await manager.save(order.surpriseBox);
      this.logger.debug('SurpriseBox saved in transaction', 'OrderRepository', { boxId: order.surpriseBox.id });

      this.logger.debug('Order completion transaction successful', 'OrderRepository', {
        orderId: id,
        newOrderStatus: order.status,
        newBoxStatus: order.surpriseBox.status
      });

      return { success: true, message: 'Order and SurpriseBox statuses updated' };
    });
  }*/

  /*private createFilteredQuery(filters: OrderFilterDto): SelectQueryBuilder<Order> {
    const queryBuilder = this.orderRepository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.customer', 'customer')
      .leftJoinAndSelect('order.surpriseBox', 'surpriseBox')
      .leftJoinAndSelect('order.store', 'store')
      .leftJoinAndSelect('order.delivery', 'delivery')
      .leftJoinAndSelect('order.payment', 'payment'); // Добавляем payment для полной информации

    // Применяем фильтры
    this.applyFilters(queryBuilder, filters);

    // Применяем сортировку
    this.applySorting(queryBuilder, filters);

    return queryBuilder;
  }*/

  /*private applyFilters(queryBuilder: SelectQueryBuilder<Order>, filters: OrderFilterDto): void {
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

  private applySorting(queryBuilder: SelectQueryBuilder<Order>, filters: OrderFilterDto): void {
    const sortBy = filters.sortBy || 'orderDate';
    const sortOrder = filters.sortOrder || 'DESC';

    // Маппинг полей для сортировки
    const sortFieldMap = {
      'id': 'order.id',
      'status': 'order.status',
      'orderDate': 'order.orderDate',
    };

    const sortField = sortFieldMap[sortBy] || 'order.orderDate';
    queryBuilder.orderBy(sortField, sortOrder);
  }*/
}
