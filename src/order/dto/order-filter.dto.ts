import {IsArray, IsDateString, IsEnum, IsNumber, IsOptional} from 'class-validator';
import {Type} from 'class-transformer';
import {FulfillmentType, OrderStatus, PaymentType} from '../entities/order.entity';
import {PaginationDto} from '@common/pagination/pagination.dto';
import { ApiProperty } from '@nestjs/swagger';

export class OrderFilterDto extends PaginationDto {
  /*@IsOptional()
  @IsNumber()
  @Type(() => Number)
  customerId?: number;*/

  /*@IsOptional()
  @IsNumber()
  @Type(() => Number)
  storeId?: number;*/

  @ApiProperty({
    description: 'Filter by specific order status',
    enum: OrderStatus,
    required: false,
    example: OrderStatus.PENDING
  })
  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;

  @ApiProperty({
    description: 'Filter by multiple order statuses (include)',
    enum: OrderStatus,
    isArray: true,
    required: false,
    example: [OrderStatus.PENDING, OrderStatus.COMPLETED]
  })
  @IsOptional()
  @IsArray()
  @IsEnum(OrderStatus, { each: true })
  statusIn?: OrderStatus[];

  @ApiProperty({
    description: 'Filter by multiple order statuses (exclude)',
    enum: OrderStatus,
    isArray: true,
    required: false,
    example: [OrderStatus.CANCELLED, OrderStatus.REFUNDED]
  })
  @IsOptional()
  @IsArray()
  @IsEnum(OrderStatus, { each: true })
  statusNotIn?: OrderStatus[];

  @ApiProperty({
    description: 'Filter by payment type',
    enum: PaymentType,
    required: false,
    example: PaymentType.APP
  })
  @IsOptional()
  @IsEnum(PaymentType)
  paymentType?: PaymentType;

  @ApiProperty({
    description: 'Filter by fulfillment type',
    enum: FulfillmentType,
    required: false,
    example: FulfillmentType.PICKUP
  })
  @IsOptional()
  @IsEnum(FulfillmentType)
  fulfillmentType?: FulfillmentType;

  @ApiProperty({
    description: 'Filter orders from this date (inclusive)',
    type: String,
    format: 'date-time',
    required: false,
    example: '2023-01-01T00:00:00Z'
  })
  @IsOptional()
  @IsDateString()
  orderDateFrom?: string;

  @ApiProperty({
    description: 'Filter orders until this date (inclusive)',
    type: String,
    format: 'date-time',
    required: false,
    example: '2023-12-31T23:59:59Z'
  })
  @IsOptional()
  @IsDateString()
  orderDateTo?: string;

  // Переопределяем валидацию для sortBy с учетом специфики Order
  @ApiProperty({
    description: 'Field to sort by',
    enum: ['orderDate', 'status', 'id'],
    required: false,
    default: 'orderDate',
    example: 'orderDate'
  })
  @IsOptional()
  @IsEnum(['orderDate', 'status', 'id'])
  sortBy?: 'orderDate' | 'status' | 'id' = 'orderDate';
}
