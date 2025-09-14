import { IsOptional, IsString, IsNumber, IsDateString, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { PaginationDto } from '@common/pagination/pagination.dto';
import { BoxStatus } from '../entities/surprise-box.entity';

export class EmployeeBoxFiltersDto extends PaginationDto {
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  boxTemplateId?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  categoryId?: number;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  discountedPriceStart?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  discountedPriceEnd?: number;

  @IsOptional()
  @IsDateString()
  pickupStartTimeFrom?: string;

  @IsOptional()
  @IsDateString()
  pickupEndTimeTo?: string;

  @IsOptional()
  @IsEnum(BoxStatus)
  status?: BoxStatus;

  @IsOptional()
  @IsDateString()
  reservedBefore?: string;

  @IsOptional()
  @IsDateString()
  reservedAfter?: string;

  @IsOptional()
  @IsDateString()
  createdBefore?: string;

  @IsOptional()
  @IsDateString()
  createdAfter?: string;

  @IsOptional()
  @IsEnum(['createdAt', 'pickupStartTime', 'pickupEndTime', 'discountedPrice', 'originalPrice', 'reservedAt'])
  sortBy?: 'createdAt' | 'pickupStartTime' | 'pickupEndTime' | 'discountedPrice' | 'originalPrice' | 'reservedAt' = 'createdAt';
}
