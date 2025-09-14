import { Injectable } from '@nestjs/common';
import { SearchStrategy } from './search-strategy.interface';
import {
  NearbySearchStrategy,
  StoreSearchStrategy,
  CitySearchStrategy,
  EmployeeSearchStrategy
} from './search-strategies';
import {
  GetNearbyBoxesFiltersDto,
  GetBoxesByStoreFiltersDto,
  GetBoxesByCityFiltersDto,
  BaseSurpriseBoxFiltersDto
} from "../dto/get-surprise-boxes-filters.dto";
import { EmployeeBoxFiltersDto } from '../dto/employee-box-filters.dto';

/**
 * Union type для всех возможных фильтров
 */
type SurpriseBoxFilters =
  | GetNearbyBoxesFiltersDto
  | GetBoxesByStoreFiltersDto
  | GetBoxesByCityFiltersDto
  | EmployeeBoxFiltersDto
  | BaseSurpriseBoxFiltersDto;

/**
 * Фабрика стратегий поиска с улучшенной типизацией
 */
@Injectable()
export class SearchStrategyFactory {
  constructor(
    private readonly nearbySearchStrategy: NearbySearchStrategy,
    private readonly storeSearchStrategy: StoreSearchStrategy,
    private readonly citySearchStrategy: CitySearchStrategy,
    private readonly employeeSearchStrategy: EmployeeSearchStrategy,
  ) {}

  /**
   * Получить подходящую стратегию поиска на основе типа фильтров
   */
  getStrategy(filters: SurpriseBoxFilters): SearchStrategy {
    if (this.isNearbyBoxesDto(filters)) {
      return this.nearbySearchStrategy;
    }

    if (this.isEmployeeBoxFiltersDto(filters)) {
      return this.employeeSearchStrategy;
    }

    if (this.isStoreBoxesDto(filters)) {
      return this.storeSearchStrategy;
    }

    if (this.isCityBoxesDto(filters)) {
      return this.citySearchStrategy;
    }

    // По умолчанию используем базовую стратегию поиска
    return this.citySearchStrategy;
  }

  /**
   * Type guards с улучшенной проверкой
   */
  private isNearbyBoxesDto(filters: SurpriseBoxFilters): filters is GetNearbyBoxesFiltersDto {
    return (
      typeof filters === 'object' &&
      filters !== null &&
      'latitude' in filters &&
      'longitude' in filters &&
      typeof filters.latitude === 'number' &&
      typeof filters.longitude === 'number'
    );
  }

  private isStoreBoxesDto(filters: SurpriseBoxFilters): filters is GetBoxesByStoreFiltersDto {
    return (
      typeof filters === 'object' &&
      filters !== null &&
      'storeId' in filters &&
      !this.isEmployeeBoxFiltersDto(filters)
    );
  }

  private isCityBoxesDto(filters: SurpriseBoxFilters): filters is GetBoxesByCityFiltersDto {
    return (
      typeof filters === 'object' &&
      filters !== null &&
      'cityId' in filters &&
      filters.cityId.length > 0
    );
  }

  private isEmployeeBoxFiltersDto(filters: SurpriseBoxFilters): filters is EmployeeBoxFiltersDto {
    if (typeof filters !== 'object' || filters === null) {
      return false;
    }

    // Проверяем наличие специфичных для employee полей
    const employeeSpecificFields = [
      'boxTemplateId',
      'discountedPriceStart',
      'discountedPriceEnd',
      'pickupStartTimeFrom',
      'pickupEndTimeTo',
      'reservedBefore',
      'reservedAfter',
      'createdBefore',
      'createdAfter',
      'status'
    ];

    return employeeSpecificFields.some(field => field in filters);
  }
}
