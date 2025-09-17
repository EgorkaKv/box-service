import { Injectable } from '@nestjs/common';
import { BaseMapper } from '@order/mappers/index';
import { Order } from '@order/entities/order.entity';
import { OrderResponseDto } from '@order/dto/order-response.dto';
import { SurpriseBoxMapper, OrderSurpriseBoxDto } from '@order/mappers/index';
import { StoreMapper, OrderStoreDto } from '@order/mappers/index';
import { PaymentMapper, OrderPaymentDto } from '@order/mappers/index';

/**
 * Опции для конфигурации маппинга
 */
export interface OrderMappingOptions {
  includeSurpriseBox?: boolean;
  includeStore?: boolean;
  includePayment?: boolean;
  includeDelivery?: boolean;
}

/**
 * Главный маппер для Order сущности
 * использует композицию специализированных мапперов
 */
@Injectable()
export class OrderMapper extends BaseMapper<Order, OrderResponseDto> {

  constructor(
    private readonly surpriseBoxMapper: SurpriseBoxMapper,
    private readonly storeMapper: StoreMapper,
    private readonly paymentMapper: PaymentMapper,
  ) {
    super();
  }

  /**
   * Основной метод маппинга с полной информацией
   */
  toDto(order: Order): OrderResponseDto {
    return this.toOrderResponseDto(order, {
      includeSurpriseBox: true,
      includeStore: true,
      includePayment: true,
      includeDelivery: true,
    });
  }

  /**
   * Конфигурируемый маппинг с возможностью исключения определенных полей
   */
  toOrderResponseDto(order: Order, options: OrderMappingOptions = {}): OrderResponseDto {
    if (!this.isValidEntity(order)) {
      throw new Error('Order entity cannot be null or undefined');
    }

    const dto = new OrderResponseDto();

    dto.id = order.id;
    dto.customerId = order.customerId;
    dto.surpriseBoxId = order.surpriseBoxId;
    dto.storeId = order.storeId;
    dto.status = order.status;
    dto.paymentType = order.paymentType;
    dto.fulfillmentType = order.fulfillmentType;
    dto.pickupCode = order.pickupCode;
    dto.orderDate = order.orderDate;
    dto.pickedAt = order.pickupedAt;
    dto.cancelledBy = order.cancelledBy;
    dto.cancelledAt = order.cancelledAt;
    dto.refundAmount = this.safeGet(order.refundAmount, 0);

    // Условный маппинг вложенных объектов
    if (options.includeSurpriseBox) {
      dto.surpriseBox = this.mapSurpriseBox(order);
    }

    if (options.includeStore) {
      dto.store = this.mapStore(order);
    }

    if (options.includePayment) {
      dto.payment = this.mapPayment(order);
    }

    if (options.includeDelivery) {
      dto.deliveryId = order.delivery?.id;
    }

    return dto;
  }

  /**
   * Краткий маппинг только основных полей (для списков)
   */
  toBriefOrderResponseDto(order: Order): Partial<OrderResponseDto> {
    if (!this.isValidEntity(order)) {
      throw new Error('Order entity cannot be null or undefined');
    }

    return {
      id: order.id,
      status: order.status,
      orderDate: order.orderDate,
      surpriseBox: this.mapSurpriseBox(order),
      store: this.mapStore(order)?.businessName ? {
        id: order.store?.id || 0,
        businessName: order.store?.business.business_name || '',
      } as any : undefined,
    };
  }

  /**
   * Безопасный маппинг surprise box
   */
  private mapSurpriseBox(order: Order): OrderSurpriseBoxDto | undefined {
    return this.safeMap(order.surpriseBox, (surpriseBox) =>
      this.surpriseBoxMapper.toDto(surpriseBox)
    );
  }

  /**
   * Безопасный маппинг магазина
   */
  private mapStore(order: Order): OrderStoreDto | undefined {
    return this.safeMap(order.store, (store) =>
      this.storeMapper.toDto(store)
    );
  }

  /**
   * Безопасный маппинг платежа
   */
  private mapPayment(order: Order): OrderPaymentDto | undefined {
    return this.safeMap(order.payment, (payment) =>
      this.paymentMapper.toDto(payment)
    );
  }
}