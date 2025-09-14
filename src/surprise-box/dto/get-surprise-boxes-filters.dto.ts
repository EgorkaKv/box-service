import {IsEnum, IsNumber, IsOptional, IsString, IsDateString, IsNotEmpty, IsInt, Max, Min} from 'class-validator';
import { Type } from 'class-transformer';
import { PaginationDto } from '@common/pagination/pagination.dto';

/**
 * Базовые фильтры для поиска surprise boxes
 */
export class BaseSurpriseBoxFiltersDto extends PaginationDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'categoryId must be a valid number' })
  categoryId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'priceFrom must be a valid number' })
  @Min(0, { message: 'priceFrom must be non-negative' })
  priceFrom?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'priceTo must be a valid number' })
  @Min(0, { message: 'priceTo must be non-negative' })
  priceTo?: number;

  @IsOptional()
  @IsDateString({}, { message: 'pickupAfter must be a valid ISO date string' })
  pickupAfter?: string;

  @IsOptional()
  @IsDateString({}, { message: 'pickupBefore must be a valid ISO date string' })
  pickupBefore?: string;

  @IsOptional()
  @IsString({ message: 'search must be a string' })
  search?: string;

  @IsOptional()
  @IsEnum(['createdAt', 'pickupStartTime', 'pickupEndTime', 'discountedPrice', 'distance'], {
    message: 'sortBy must be one of: createdAt, pickupStartTime, pickupEndTime, discountedPrice, distance'
  })
  sortBy?: 'createdAt' | 'pickupStartTime' | 'pickupEndTime' | 'discountedPrice' | 'distance' = 'createdAt';
}

/**
 * Фильтры для поиска боксов рядом с координатами
 */
export class GetNearbyBoxesFiltersDto extends BaseSurpriseBoxFiltersDto {
  @Type(() => Number)
  @IsNumber({}, { message: 'latitude must be a valid number' })
  @IsNotEmpty({ message: 'latitude is required' })
  @Min(-90, { message: 'latitude must be between -90 and 90' })
  @Max(90, { message: 'latitude must be between -90 and 90' })
  latitude: number;

  @Type(() => Number)
  @IsNumber({}, { message: 'longitude must be a valid number' })
  @IsNotEmpty({ message: 'longitude is required' })
  @Min(-180, { message: 'longitude must be between -180 and 180' })
  @Max(180, { message: 'longitude must be between -180 and 180' })
  longitude: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'radius must be an integer' })
  @Min(100, { message: 'radius must be at least 100 meters' })
  @Max(20000, { message: 'radius must not exceed 20000 meters' })
  radius: number = 2000;
}

/**
 * Фильтры для поиска боксов по магазину
 */
export class GetBoxesByStoreFiltersDto extends BaseSurpriseBoxFiltersDto {
  @Type(() => Number)
  @IsNumber({}, { message: 'storeId must be a valid number' })
  @Min(1, { message: 'storeId must be positive' })
  storeId: number;
}

/**
 * Фильтры для поиска боксов по городу
 */
export class GetBoxesByCityFiltersDto extends BaseSurpriseBoxFiltersDto {
  @IsString({ message: 'cityId must be a string' })
  @IsNotEmpty({ message: 'cityId is required' })
  cityId: string;
}
