import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { AppLogger } from '@common/logger/app-logger.service';
import {OrderRepository} from "@order/repositories/order.repository";

/**
 * Guard для проверки, что заказ принадлежит аутентифицированному клиенту
 */
@Injectable()
export class OrderOwnershipGuard implements CanActivate {
  constructor(
    private readonly orderRepository: OrderRepository,
    private readonly logger: AppLogger,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const orderId = parseInt(request.params.id);

    if (!user || !user.id) {
      this.logger.warn('OrderOwnershipGuard: User not authenticated', 'OrderOwnershipGuard');
      throw new ForbiddenException('User not authenticated');
    }

    if (!orderId || isNaN(orderId)) {
      this.logger.warn('OrderOwnershipGuard: Invalid order ID', 'OrderOwnershipGuard', { orderId });
      throw new ForbiddenException('Invalid order ID');
    }

    // Проверяем принадлежность заказа
    const order = await this.orderRepository.findOneBy({id: orderId});

    if (!order) {
      this.logger.warn('OrderOwnershipGuard: Order not found', 'OrderOwnershipGuard', {
        orderId,
        customerId: user.id
      });
      throw new ForbiddenException('Order not found');
    }

    if (order.customerId !== user.id) {
      this.logger.warn('OrderOwnershipGuard: Order access denied', 'OrderOwnershipGuard', {
        orderId,
        requestingCustomerId: user.id,
        actualCustomerId: order.customerId
      });
      throw new ForbiddenException('Access denied to this order');
    }

    this.logger.debug('OrderOwnershipGuard: Access granted', 'OrderOwnershipGuard', {
      orderId,
      customerId: user.id
    });

    return true;
  }
}

/**
 * Guard для проверки принадлежности заказа к магазину (для работников)
 */
@Injectable()
export class StoreOrderOwnershipGuard implements CanActivate {
  constructor(
    private readonly orderRepository: OrderRepository,
    private readonly logger: AppLogger,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const orderId = parseInt(request.params.id || request.body.orderId);

    if (!user || !user.storeId) {
      this.logger.warn('StoreOrderOwnershipGuard: Store user not authenticated', 'StoreOrderOwnershipGuard');
      throw new ForbiddenException('Store user not authenticated');
    }

    if (!orderId || isNaN(orderId)) {
      this.logger.warn('StoreOrderOwnershipGuard: Invalid order ID', 'StoreOrderOwnershipGuard', { orderId });
      throw new ForbiddenException('Invalid order ID');
    }

    const order = await this.orderRepository.findOneBy({id:orderId});

    if (!order) {
      this.logger.warn('StoreOrderOwnershipGuard: Order not found', 'StoreOrderOwnershipGuard', {
        orderId,
        storeId: user.storeId
      });
      throw new ForbiddenException('Order not found');
    }

    if (order.storeId !== user.storeId) {
      this.logger.warn('StoreOrderOwnershipGuard: Store order access denied', 'StoreOrderOwnershipGuard', {
        orderId,
        requestingStoreId: user.storeId,
        actualStoreId: order.storeId
      });
      throw new ForbiddenException('This order does not belong to your store');
    }

    this.logger.debug('StoreOrderOwnershipGuard: Store access granted', 'StoreOrderOwnershipGuard', {
      orderId,
      storeId: user.storeId
    });

    return true;
  }
}
