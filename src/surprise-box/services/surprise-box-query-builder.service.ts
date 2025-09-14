import { Injectable } from '@nestjs/common';
import {SelectQueryBuilder } from 'typeorm';
import { SurpriseBox } from '../entities/surprise-box.entity';
import { SearchStrategyFactory } from '../strategies/search-strategy.factory';
import { BaseSurpriseBoxFiltersDto, GetNearbyBoxesFiltersDto } from '../dto/get-surprise-boxes-filters.dto';
import { EmployeeBoxFiltersDto } from '../dto/employee-box-filters.dto';

/**
 * Сервис для построения сложных запросов
 * Инкапсулирует логику фильтрации и сортировки
 */
@Injectable()
export class SurpriseBoxQueryBuilderService {
  constructor(
    private readonly searchStrategyFactory: SearchStrategyFactory,
  ) {}

  /**
   * Создать запрос с фильтрами для клиентов
   */
  createCustomerQuery(
    queryBuilder: SelectQueryBuilder<SurpriseBox>,
    filters: BaseSurpriseBoxFiltersDto
  ): SelectQueryBuilder<SurpriseBox> {

    // Применяем стратегию поиска
    const strategy = this.searchStrategyFactory.getStrategy(filters);
    strategy.validateFilters(filters);
    strategy.applyFilters(queryBuilder, filters);

    // Применяем сортировку
    this.applySortingForCustomer(queryBuilder, filters);

    return queryBuilder;
  }

  /**
   * Создать запрос с фильтрами для работников
   */
  createEmployeeQuery(
    queryBuilder: SelectQueryBuilder<SurpriseBox>,
    storeId: number,
    filters: EmployeeBoxFiltersDto
  ): SelectQueryBuilder<SurpriseBox> {

    // Базовый фильтр по магазину
    queryBuilder.where('surprise_box.storeId = :storeId', { storeId });

    // Применяем стратегию поиска
    const strategy = this.searchStrategyFactory.getStrategy(filters);
    strategy.validateFilters(filters);
    strategy.applyFilters(queryBuilder, filters);

    // Применяем сортировку для работников
    this.applySortingForEmployee(queryBuilder, filters);

    return queryBuilder;
  }

  /**
   * Применить сортировку для клиентских запросов
   */
  private applySortingForCustomer(queryBuilder: SelectQueryBuilder<SurpriseBox>, filters: BaseSurpriseBoxFiltersDto): void {
    const sortBy = filters.sortBy || 'createdAt';
    const sortOrder = filters.sortOrder || 'DESC';

    // Специальная обработка сортировки по расстоянию
    if (sortBy === 'distance' && this.isNearbyFilters(filters)) {
      queryBuilder.addSelect(
        `ST_Distance(
          surprise_box.store_location,
          ST_SetSRID(ST_MakePoint(:longitude, :latitude), 4326)
        )`,
        'distance'
      ).setParameters({
        latitude: (filters as GetNearbyBoxesFiltersDto).latitude,
        longitude: (filters as GetNearbyBoxesFiltersDto).longitude
      });
      queryBuilder.orderBy('distance', sortOrder);
      return;
    }

    // Стандартная сортировка
    const sortFieldMap = {
      'createdAt': 'surprise_box.createdAt',
      'pickupStartTime': 'surprise_box.pickupStartTime',
      'pickupEndTime': 'surprise_box.pickupEndTime',
      'discountedPrice': 'surprise_box.discountedPrice',
      'originalPrice': 'surprise_box.originalPrice',
    };

    const sortField = sortFieldMap[sortBy] || 'surprise_box.createdAt';
    queryBuilder.orderBy(sortField, sortOrder);
  }

  /**
   * Применить сортировку для работников
   */
  private applySortingForEmployee(queryBuilder: SelectQueryBuilder<SurpriseBox>, filters: EmployeeBoxFiltersDto): void {
    const sortBy = filters.sortBy || 'createdAt';
    const sortOrder = filters.sortOrder || 'DESC';

    const sortFieldMap = {
      'createdAt': 'surprise_box.createdAt',
      'pickupStartTime': 'surprise_box.pickupStartTime',
      'pickupEndTime': 'surprise_box.pickupEndTime',
      'discountedPrice': 'surprise_box.discountedPrice',
      'originalPrice': 'surprise_box.originalPrice',
      'reservedAt': 'surprise_box.reservedAt',
    };

    const sortField = sortFieldMap[sortBy] || 'surprise_box.createdAt';
    queryBuilder.orderBy(sortField, sortOrder);
  }

  private isNearbyFilters(filters: BaseSurpriseBoxFiltersDto): filters is GetNearbyBoxesFiltersDto {
    return 'latitude' in filters && 'longitude' in filters;
  }
}
