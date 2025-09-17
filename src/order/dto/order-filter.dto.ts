import {IsArray, IsDateString, IsEnum, IsNumber, IsOptional} from 'class-validator';
import {Type} from 'class-transformer';
import {FulfillmentType, OrderStatus, PaymentType} from '../entities/order.entity';
import {PaginationDto} from '@common/pagination/pagination.dto';

export class OrderFilterDto extends PaginationDto {
  /*@IsOptional()
  @IsNumber()
  @Type(() => Number)
  customerId?: number;*/

  /*@IsOptional()
  @IsNumber()
  @Type(() => Number)
  storeId?: number;*/

  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;

  @IsOptional()
  @IsArray()
  @IsEnum(OrderStatus, { each: true })
  statusIn?: OrderStatus[];

  @IsOptional()
  @IsArray()
  @IsEnum(OrderStatus, { each: true })
  statusNotIn?: OrderStatus[];

  @IsOptional()
  @IsEnum(PaymentType)
  paymentType?: PaymentType;

  @IsOptional()
  @IsEnum(FulfillmentType)
  fulfillmentType?: FulfillmentType;

  @IsOptional()
  @IsDateString()
  orderDateFrom?: string;

  @IsOptional()
  @IsDateString()
  orderDateTo?: string;

  // Переопределяем валидацию для sortBy с учетом специфики Order
  @IsOptional()
  @IsEnum(['orderDate', 'status', 'id'])
  sortBy?: 'orderDate' | 'status' | 'id' = 'orderDate';
}
