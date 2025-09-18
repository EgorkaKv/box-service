import {IsDateString, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString} from "class-validator";
import {FulfillmentType, PaymentType} from "@order/entities/order.entity";
import {PaymentMethod} from "@order/entities/payment.entity";
import { ApiProperty } from '@nestjs/swagger';

export class CreateOrderDto {
  @ApiProperty({
    description: 'Surprise box ID to order',
    example: 1,
    type: Number
  })
  @IsNotEmpty()
  @IsNumber()
  boxId: number;

  @ApiProperty({
    description: 'Customer ID who is placing the order',
    example: 123,
    type: Number
  })
  @IsNotEmpty()
  @IsNumber()
  customerId: number;

  @ApiProperty({
    description: 'Store ID where the box is located',
    example: 5,
    type: Number
  })
  @IsNotEmpty()
  @IsNumber()
  storeId: number;

  @ApiProperty({
    description: 'Payment type for the order',
    enum: PaymentType,
    example: PaymentType.APP
  })
  @IsNotEmpty()
  @IsEnum(PaymentType)
  paymentType: PaymentType;

  @ApiProperty({
    description: 'Fulfillment type for the order',
    enum: FulfillmentType,
    example: FulfillmentType.PICKUP
  })
  @IsNotEmpty()
  @IsEnum(FulfillmentType)
  fulfillmentType: FulfillmentType;

  @ApiProperty({
    description: 'Payment method used',
    enum: PaymentMethod,
    example: PaymentMethod.CARD
  })
  @IsNotEmpty()
  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @ApiProperty({
    description: 'Order amount in smallest currency unit (e.g., cents)',
    example: 2500,
    type: Number
  })
  @IsNotEmpty()
  @IsNumber()
  amount: number;

  @ApiProperty({
    description: 'Payment transaction ID',
    example: 'txn_1234567890',
    required: false,
    type: String
  })
  @IsOptional()
  @IsString()
  transactionId?: string;

  @ApiProperty({
    description: 'Payment gateway used',
    example: 'stripe',
    required: false,
    type: String
  })
  @IsOptional()
  @IsString()
  paymentGateway?: string;

  @ApiProperty({
    description: 'Delivery address (required for delivery orders)',
    example: '123 Main St, City, Country',
    required: false,
    type: String
  })
  @IsOptional()
  @IsString()
  deliveryAddress?: string;

  @ApiProperty({
    description: 'Delivery service provider',
    example: 'DHL',
    required: false,
    type: String
  })
  @IsOptional()
  @IsString()
  deliveryService?: string;

  @ApiProperty({
    description: 'Estimated delivery date and time',
    example: '2023-12-25T10:00:00Z',
    required: false,
    type: String,
    format: 'date-time'
  })
  @IsOptional()
  @IsDateString()
  estimatedDeliveryAt?: string | Date;

  @ApiProperty({
    description: 'Delivery tracking code',
    example: 'TRK123456789',
    required: false,
    type: String
  })
  @IsOptional()
  @IsString()
  trackingCode?: string;
}