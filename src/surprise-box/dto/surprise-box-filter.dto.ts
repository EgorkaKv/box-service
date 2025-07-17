import { IsEnum, IsNumber, IsOptional, IsString, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';
import { BoxStatus } from '../entities/surprise-box.entity';
import { PaginationDto } from '@common/pagination/pagination.dto';

export class SurpriseBoxFilterDto extends PaginationDto {
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  storeId?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  categoryId?: number;

  @IsOptional()
  @IsString()
  storeCity?: string;

  @IsOptional()
  @IsEnum(BoxStatus)
  status?: BoxStatus;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  priceFrom?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  priceTo?: number;

  @IsOptional()
  @IsDateString()
  saleStartFrom?: string;

  @IsOptional()
  @IsDateString()
  saleStartTo?: string;

  @IsOptional()
  @IsDateString()
  saleEndFrom?: string;

  @IsOptional()
  @IsDateString()
  saleEndTo?: string;

  @IsOptional()
  @IsString()
  search?: string; // Поиск по названию или описанию

  // Геолокационные фильтры
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  latitude?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  longitude?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  radius?: number; // радиус в метрах

  // Переопределяем валидацию для sortBy с учетом специфики SurpriseBox
  @IsOptional()
  @IsEnum(['createdAt', 'saleStartTime', 'saleEndTime', 'discountedPrice', 'originalPrice'])
  sortBy?: 'createdAt' | 'saleStartTime' | 'saleEndTime' | 'discountedPrice' | 'originalPrice' = 'createdAt';
}
