import {OrderStatus, FulfillmentType, PaymentType, CancellerType, Order} from '../entities/order.entity';
import {PaymentMethod} from "@order/entities/payment.entity";
import {OrderPaymentDto} from "@order/mappers";
import {ApiProperty, ApiPropertyOptional} from '@nestjs/swagger';

export class OrderResponseDto {
  @ApiProperty({
    description: 'Unique order identifier',
    example: 1,
    type: Number
  })
  id: number;

  @ApiProperty({
    description: 'Customer ID who placed the order',
    example: 123,
    type: Number
  })
  customerId: number;

  @ApiProperty({
    description: 'Surprise box ID that was ordered',
    example: 42,
    type: Number
  })
  surpriseBoxId: number;

  @ApiProperty({
    description: 'Store ID where the order is located',
    example: 5,
    type: Number
  })
  storeId: number;

  @ApiProperty({
    description: 'Current status of the order',
    enum: OrderStatus,
    example: OrderStatus.COMPLETED
  })
  status: OrderStatus;

  @ApiProperty({
    description: 'Payment type used for the order',
    enum: PaymentType,
    example: PaymentType.APP
  })
  paymentType: PaymentType;

  @ApiProperty({
    description: 'Fulfillment type for the order',
    enum: FulfillmentType,
    example: FulfillmentType.PICKUP
  })
  fulfillmentType: FulfillmentType;

  @ApiProperty({
    description: 'Pickup code for order collection',
    example: 'ABC123',
    type: String
  })
  pickupCode: string;

  @ApiProperty({
    description: 'Date and time when the order was placed',
    type: Date,
    example: '2023-12-01T10:00:00Z'
  })
  orderDate: Date;

  @ApiProperty({
    description: 'Date and time when the order was picked up',
    type: Date,
    required: false,
    example: '2023-12-01T15:30:00Z'
  })
  pickedAt?: Date;

  @ApiProperty({
    description: 'Who cancelled the order (if applicable)',
    enum: CancellerType,
    required: false,
    example: CancellerType.CUSTOMER
  })
  cancelledBy?: CancellerType;

  @ApiProperty({
    description: 'Date and time when the order was cancelled',
    type: Date,
    required: false,
    example: '2023-12-01T12:00:00Z'
  })
  cancelledAt?: Date;

  @ApiProperty({
    description: 'Refund amount in smallest currency unit (e.g., cents)',
    example: 0,
    type: Number
  })
  refundAmount: number;

  @ApiProperty({
    description: 'Delivery identifier if applicable',
    example: 1,
    type: Number,
    required: false
  })
  deliveryId?: number; // Идентификатор доставки, если применимо

/*  @ApiProperty({
    description: 'Surprise box details',
    type: 'object',
    required: false,
    example: {
      id: { type: 'number', example: 42 },
      title: { type: 'string', example: 'Mystery Food Box' },
      originalPrice: { type: 'number', example: 5000 },
      discountedPrice: { type: 'number', example: 2500 },
      pickupStartTime: { type: 'string', format: 'date-time', example: '2023-12-01T10:00:00Z' },
      pickupEndTime: { type: 'string', format: 'date-time', example: '2023-12-01T18:00:00Z' },
      imageUrl: { type: 'string', example: 'https://example.com/box-image.jpg' }
    }
  })*/
  surpriseBox?: {
    id: number;
    title: string;
    originalPrice: number;
    discountedPrice: number;
    pickupStartTime: Date;
    pickupEndTime: Date;
    imageUrl?: string;
  };

/*  @ApiProperty({
    description: 'Store details',
    type: 'object',
    required: false,
    properties: {
      id: { type: 'number', example: 5 },
      businessName: { type: 'string', example: 'Amazing Bakery' },
      address: { type: 'string', example: '123 Main Street' },
      city: { type: 'string', example: 'New York' },
      storeImageUrl: { type: 'string', example: 'https://example.com/store-image.jpg' }
    }
  })*/
  store?: {
    id: number;
    businessName: string;
    address: string;
    city: string;
    storeImageUrl?: string;
  };

/*  @ApiProperty({
    description: 'Payment details',
    type: 'object',
    required: false
  })*/
  payment?: OrderPaymentDto | undefined;
}
