import {Injectable} from "@nestjs/common";
import {Order} from "@order/entities/order.entity";
import {OrderResponseDto} from "@order/dto/order-response.dto";


@Injectable()
export class OrderMapper {

  static toOrderResponseDto(order: Order): OrderResponseDto {
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
    dto.refundAmount = order.refundAmount;
    dto.deliveryId = order.delivery?.id;

    // Маппинг surprise box
    dto.surpriseBox = order.surpriseBox ?{
      id: order.surpriseBox.id,
      title: order.surpriseBox.title,
      originalPrice: order.surpriseBox.originalPrice,
      discountedPrice: order.surpriseBox.discountedPrice,
      pickupStartTime: order.surpriseBox.pickupStartTime,
      pickupEndTime: order.surpriseBox.pickupEndTime,
      imageUrl: order.surpriseBox.imageUrl,
    }: undefined;


    // Маппинг store
    dto.store = order.store ? {
      id: order.store.id,
      businessName: order.surpriseBox.businessName,
      address: order.store.address,
      city: order.store.city,
      storeImageUrl: order.store.storeImageUrl,
    } : undefined;

    dto.payment = order.payment ? {
      id: order.payment.id,
      paymentMethod: order.payment.paymentMethod,
      amount: order.payment.amount,
      currency: order.payment.currency,
      transactionId: order.payment.transactionId,
    } : undefined;

    return dto;
  }

  static badRequestMessages = new Set([
    'Invalid amount - must be positive',
    'Delivery address is required for delivery orders',
    'Prices must be greater than 0',
    'Discounted price cannot be greater than original price',
    'Pickup start time must be before pickup end time',
    'Sale start time must be before sale end time',
    'Pickup start time cannot be before sale start time',
    'Pickup end time cannot be after sale end time',
    'Required parameters cannot be null or empty',
  ]);

  static notFoundMessages = new Set([
    'Customer not found',
    'Store not found',
  ]);
}