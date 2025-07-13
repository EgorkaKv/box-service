import {OrderStatus, FulfillmentType, PaymentType, CancellerType, Order} from '../entities/order.entity';
import {PaymentMethod} from "@order/entities/payment.entity";

export class OrderResponseDto {
  id: number;
  customerId: number;
  surpriseBoxId: number;
  storeId: number;
  status: OrderStatus;
  paymentType: PaymentType;
  fulfillmentType: FulfillmentType;
  pickupCode: string;
  orderDate: Date;
  pickedAt?: Date;
  cancelledBy?: CancellerType;
  cancelledAt?: Date;
  refundAmount: number;
  deliveryId?: number; // Идентификатор доставки, если применимо

  surpriseBox?: {
    id: number;
    title: string;
    originalPrice: number;
    discountedPrice: number;
    pickupStartTime: Date;
    pickupEndTime: Date;
    imageUrl?: string;
  };

  store?: {
    id: number;
    businessName: string;
    address: string;
    city: string;
    storeImageUrl?: string;
  };

  payment?: {
    id: number;
    paymentMethod: PaymentMethod;
    amount: number;
    currency: string;
    transactionId?: string; // Идентификатор транзакции, если применимо
  };
}
