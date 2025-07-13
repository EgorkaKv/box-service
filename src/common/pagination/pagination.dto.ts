import { IsOptional, IsNumber, IsString, IsEnum, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class PaginationDto {
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @IsOptional()
  @IsString()
  sortBy?: string = 'orderDate';

  @IsOptional()
  @IsEnum(['ASC', 'DESC'])
  sortOrder?: 'ASC' | 'DESC' = 'DESC';
}

export class PaginatedResponseDto<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  meta?: {
    sortBy: string;
    sortOrder: 'ASC' | 'DESC';
    filters?: Record<string, any>;
  };

  constructor(
    data: T[],
    total: number,
    page: number,
    limit: number,
    sortBy?: string,
    sortOrder?: 'ASC' | 'DESC',
    filters?: Record<string, any>
  ) {
    this.data = data;

    const totalPages = Math.ceil(total / limit);

    this.pagination = {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    };

    this.meta = {
      sortBy: sortBy || 'orderDate',
      sortOrder: sortOrder || 'DESC',
      filters: filters || {},
    };
  }
}
