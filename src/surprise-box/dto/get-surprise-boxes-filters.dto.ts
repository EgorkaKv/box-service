import {IsEnum, IsNumber, IsOptional, IsString, IsDateString, IsNotEmpty, IsInt, Max, Min} from 'class-validator';
import { Type } from 'class-transformer';
import { PaginationDto } from '@common/pagination/pagination.dto';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Base filters for searching surprise boxes
 */
export class BaseSurpriseBoxFiltersDto extends PaginationDto {
  @ApiProperty({
    description: 'Category ID to filter boxes',
    example: 1,
    required: false,
    type: Number
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'categoryId must be a valid number' })
  categoryId?: number;

  @ApiProperty({
    description: 'Minimum price in cents',
    example: 1000,
    minimum: 0,
    required: false,
    type: Number
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'priceFrom must be a valid number' })
  @Min(0, { message: 'priceFrom must be non-negative' })
  priceFrom?: number;

  @ApiProperty({
    description: 'Maximum price in cents',
    example: 5000,
    minimum: 0,
    required: false,
    type: Number
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'priceTo must be a valid number' })
  @Min(0, { message: 'priceTo must be non-negative' })
  priceTo?: number;

  @ApiProperty({
    description: 'Pickup time not earlier than specified (ISO format)',
    example: '2024-01-01T18:00:00Z',
    required: false,
    type: String,
    format: 'date-time'
  })
  @IsOptional()
  @IsDateString({}, { message: 'pickupAfter must be a valid ISO date string' })
  pickupAfter?: string;

  @ApiProperty({
    description: 'Pickup time not later than specified (ISO format)',
    example: '2024-01-01T20:00:00Z',
    required: false,
    type: String,
    format: 'date-time'
  })
  @IsOptional()
  @IsDateString({}, { message: 'pickupBefore must be a valid ISO date string' })
  pickupBefore?: string;

  @ApiProperty({
    description: 'Search by box title or description',
    example: 'coffee',
    required: false,
    type: String
  })
  @IsOptional()
  @IsString({ message: 'search must be a string' })
  search?: string;

  @ApiProperty({
    description: 'Field to sort results by',
    enum: ['createdAt', 'pickupStartTime', 'pickupEndTime', 'discountedPrice', 'distance'],
    example: 'createdAt',
    default: 'createdAt',
    required: false
  })
  @IsOptional()
  @IsEnum(['createdAt', 'pickupStartTime', 'pickupEndTime', 'discountedPrice', 'distance'], {
    message: 'sortBy must be one of: createdAt, pickupStartTime, pickupEndTime, discountedPrice, distance'
  })
  sortBy?: 'createdAt' | 'pickupStartTime' | 'pickupEndTime' | 'discountedPrice' | 'distance' = 'createdAt';
}

/**
 * Filters for searching boxes near coordinates
 */
export class GetNearbyBoxesFiltersDto extends BaseSurpriseBoxFiltersDto {
  @ApiProperty({
    description: 'User coordinates latitude',
    example: 49.8397,
    minimum: -90,
    maximum: 90,
    type: Number
  })
  @Type(() => Number)
  @IsNumber({}, { message: 'latitude must be a valid number' })
  @IsNotEmpty({ message: 'latitude is required' })
  @Min(-90, { message: 'latitude must be between -90 and 90' })
  @Max(90, { message: 'latitude must be between -90 and 90' })
  latitude: number;

  @ApiProperty({
    description: 'User coordinates longitude',
    example: 24.0297,
    minimum: -180,
    maximum: 180,
    type: Number
  })
  @Type(() => Number)
  @IsNumber({}, { message: 'longitude must be a valid number' })
  @IsNotEmpty({ message: 'longitude is required' })
  @Min(-180, { message: 'longitude must be between -180 and 180' })
  @Max(180, { message: 'longitude must be between -180 and 180' })
  longitude: number;

  @ApiProperty({
    description: 'Search radius in meters',
    example: 2000,
    default: 2000,
    minimum: 100,
    maximum: 20000,
    required: false,
    type: Number
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'radius must be an integer' })
  @Min(100, { message: 'radius must be at least 100 meters' })
  @Max(20000, { message: 'radius must not exceed 20000 meters' })
  radius: number = 2000;
}

/**
 * Filters for searching boxes by store
 */
export class GetBoxesByStoreFiltersDto extends BaseSurpriseBoxFiltersDto {
  @ApiProperty({
    description: 'Store ID to search boxes for',
    example: 1,
    minimum: 1,
    type: Number
  })
  @Type(() => Number)
  @IsNumber({}, { message: 'storeId must be a valid number' })
  @Min(1, { message: 'storeId must be positive' })
  storeId: number;
}

/**
 * Filters for searching boxes by city
 */
export class GetBoxesByCityFiltersDto extends BaseSurpriseBoxFiltersDto {
  @ApiProperty({
    description: 'City identifier',
    example: 'lviv',
    type: String
  })
  @IsString({ message: 'cityId must be a string' })
  @IsNotEmpty({ message: 'cityId is required' })
  cityId: string;
}
