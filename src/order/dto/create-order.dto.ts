import {IsDateString, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString} from "class-validator";
import {FulfillmentType, PaymentType} from "@order/entities/order.entity";
import {PaymentMethod} from "@order/entities/payment.entity";

export class CreateOrderDto {
  @IsNotEmpty()
  @IsNumber()
  boxId: number;

  @IsNotEmpty()
  @IsNumber()
  customerId: number;

  @IsNotEmpty()
  @IsNumber()
  storeId: number;

  @IsNotEmpty()
  @IsEnum(PaymentType)
  paymentType: PaymentType;

  @IsNotEmpty()
  @IsEnum(FulfillmentType)
  fulfillmentType: FulfillmentType;

  @IsNotEmpty()
  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @IsNotEmpty()
  @IsNumber()
  amount: number;

  @IsOptional()
  @IsString()
  transactionId?: string;

  @IsOptional()
  @IsString()
  paymentGateway?: string;

  @IsOptional()
  @IsString()
  deliveryAddress?: string;

  @IsOptional()
  @IsString()
  deliveryService?: string;

  @IsOptional()
  @IsDateString()
  estimatedDeliveryAt?: string | Date;

  @IsOptional()
  @IsString()
  trackingCode?: string;
}