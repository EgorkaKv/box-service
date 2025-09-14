import { BadRequestException, Injectable } from '@nestjs/common';
import { SelectQueryBuilder } from 'typeorm';
import { SurpriseBox, BoxStatus } from '../entities/surprise-box.entity';
import { SearchStrategy } from './search-strategy.interface';
import { GetNearbyBoxesFiltersDto, GetBoxesByStoreFiltersDto, GetBoxesByCityFiltersDto } from "@surprise-box/dto/get-surprise-boxes-filters.dto";
import { EmployeeBoxFiltersDto } from '../dto/employee-box-filters.dto';

/**
 * Общие функции для применения фильтров
 */
export class CommonFilters {
  /**
   * Применяет общие фильтры для customer (категория, цена, время получения, поиск)
   */
  static applyCustomerCommonFilters(queryBuilder: SelectQueryBuilder<SurpriseBox>, filters: any): void {
    if (filters.categoryId) {
      queryBuilder.andWhere('surprise_box.categoryId = :categoryId', { categoryId: filters.categoryId });
    }

    if (filters.priceFrom) {
      queryBuilder.andWhere('surprise_box.discountedPrice >= :priceFrom', { priceFrom: filters.priceFrom });
    }

    if (filters.priceTo) {
      queryBuilder.andWhere('surprise_box.discountedPrice <= :priceTo', { priceTo: filters.priceTo });
    }

    if (filters.pickupAfter) {
      queryBuilder.andWhere('surprise_box.pickupStartTime >= :pickupAfter', { pickupAfter: filters.pickupAfter });
    }

    if (filters.pickupBefore) {
      queryBuilder.andWhere('surprise_box.pickupEndTime <= :pickupBefore', { pickupBefore: filters.pickupBefore });
    }

    if (filters.search) {
      queryBuilder.andWhere(
        '(surprise_box.title ILIKE :search OR surprise_box.description ILIKE :search OR surprise_box.businessName ILIKE :search)',
        { search: `%${filters.search}%` }
      );
    }
  }

  /**
   * Применяет базовые фильтры для активных боксов customer
   */
  static applyActiveBoxFilters(queryBuilder: SelectQueryBuilder<SurpriseBox>): void {
    queryBuilder
      .where('surprise_box.status = :status', { status: BoxStatus.ACTIVE })
      .andWhere('surprise_box.sale_end_time > NOW()')
      .andWhere('surprise_box.sale_start_time <= NOW()');
  }

  /**
   * Валидация дат
   */
  static validateDateRange(startDate: string | undefined, endDate: string | undefined, fieldName: string): void {
    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
      throw new BadRequestException(`${fieldName}After cannot be later than ${fieldName}Before`);
    }
  }

  /**
   * Валидация диапазона цен
   */
  static validatePriceRange(priceStart: number | undefined, priceEnd: number | undefined): void {
    if (priceStart && priceEnd && priceStart > priceEnd) {
      throw new BadRequestException('priceStart cannot be greater than priceEnd');
    }
  }
}

/**
 * Стратегия поиска боксов рядом с координатами
 */
@Injectable()
export class NearbySearchStrategy implements SearchStrategy<GetNearbyBoxesFiltersDto> {

  applyFilters(queryBuilder: SelectQueryBuilder<SurpriseBox>, filters: GetNearbyBoxesFiltersDto): void {
    // Базовые фильтры для активных боксов
    CommonFilters.applyActiveBoxFilters(queryBuilder);

    // Геопространственный поиск
    queryBuilder.andWhere(
      `ST_DWithin(
        surprise_box.store_location,
        ST_SetSRID(ST_MakePoint(:longitude, :latitude), 4326),
        :radius
      )`,
      {
        latitude: filters.latitude,
        longitude: filters.longitude,
        radius: filters.radius
      }
    );

    // Применяем общие фильтры
    CommonFilters.applyCustomerCommonFilters(queryBuilder, filters);
  }

  validateFilters(filters: GetNearbyBoxesFiltersDto): void {
    if (!filters.latitude || !filters.longitude) {
      throw new BadRequestException('Latitude and longitude are required for nearby search');
    }
    if (!filters.radius || filters.radius < 100 || filters.radius > 20000) {
      throw new BadRequestException('Radius must be between 100 and 20000 meters');
    }

    CommonFilters.validatePriceRange(filters.priceFrom, filters.priceTo);
    CommonFilters.validateDateRange(filters.pickupAfter, filters.pickupBefore, 'pickup');
  }

  getType(): string {
    return 'nearby';
  }
}

/**
 * Стратегия поиска боксов по магазину (для customer)
 */
@Injectable()
export class StoreSearchStrategy implements SearchStrategy<GetBoxesByStoreFiltersDto> {

  applyFilters(queryBuilder: SelectQueryBuilder<SurpriseBox>, filters: GetBoxesByStoreFiltersDto): void {
    // Базовые фильтры для активных боксов (для customer)
    CommonFilters.applyActiveBoxFilters(queryBuilder);
    queryBuilder.andWhere('surprise_box.storeId = :storeId', { storeId: filters.storeId });

    // Применяем общие фильтры
    CommonFilters.applyCustomerCommonFilters(queryBuilder, filters);
  }

  validateFilters(filters: GetBoxesByStoreFiltersDto): void {
    if (!filters.storeId || filters.storeId <= 0) {
      throw new BadRequestException('Valid store ID is required');
    }

    CommonFilters.validatePriceRange(filters.priceFrom, filters.priceTo);
    CommonFilters.validateDateRange(filters.pickupAfter, filters.pickupBefore, 'pickup');
  }

  getType(): string {
    return 'store';
  }
}

/**
 * Стратегия поиска боксов по городу
 */
@Injectable()
export class CitySearchStrategy implements SearchStrategy<GetBoxesByCityFiltersDto> {

  applyFilters(queryBuilder: SelectQueryBuilder<SurpriseBox>, filters: GetBoxesByCityFiltersDto): void {
    // Базовые фильтры для активных боксов
    CommonFilters.applyActiveBoxFilters(queryBuilder);
    queryBuilder.andWhere('surprise_box.storeCity = :cityId', { cityId: filters.cityId });

    // Применяем общие фильтры
    CommonFilters.applyCustomerCommonFilters(queryBuilder, filters);
  }

  validateFilters(filters: GetBoxesByCityFiltersDto): void {
    if (!filters.cityId || filters.cityId.trim() === '') {
      throw new BadRequestException('City ID is required');
    }

    CommonFilters.validatePriceRange(filters.priceFrom, filters.priceTo);
    CommonFilters.validateDateRange(filters.pickupAfter, filters.pickupBefore, 'pickup');
  }

  getType(): string {
    return 'city';
  }
}

/**
 * Стратегия поиска боксов для работников магазина (расширенные фильтры)
 */
@Injectable()
export class EmployeeSearchStrategy implements SearchStrategy<EmployeeBoxFiltersDto> {

  applyFilters(queryBuilder: SelectQueryBuilder<SurpriseBox>, filters: EmployeeBoxFiltersDto): void {
    // Для работников НЕ применяем базовые фильтры активности - они видят все боксы

    // Фильтр по шаблону
    if (filters.boxTemplateId) {
      queryBuilder.andWhere('surprise_box.boxTemplateId = :boxTemplateId', { boxTemplateId: filters.boxTemplateId });
    }

    // Общие фильтры с customer
    if (filters.categoryId) {
      queryBuilder.andWhere('surprise_box.categoryId = :categoryId', { categoryId: filters.categoryId });
    }

    if (filters.search) {
      queryBuilder.andWhere(
        '(surprise_box.title ILIKE :search OR surprise_box.description ILIKE :search)',
        { search: `%${filters.search}%` }
      );
    }

    // Специфичные фильтры для работников
    if (filters.discountedPriceStart) {
      queryBuilder.andWhere('surprise_box.discountedPrice >= :discountedPriceStart', {
        discountedPriceStart: filters.discountedPriceStart
      });
    }

    if (filters.discountedPriceEnd) {
      queryBuilder.andWhere('surprise_box.discountedPrice <= :discountedPriceEnd', {
        discountedPriceEnd: filters.discountedPriceEnd
      });
    }

    if (filters.pickupStartTimeFrom) {
      queryBuilder.andWhere('surprise_box.pickupStartTime >= :pickupStartTimeFrom', {
        pickupStartTimeFrom: filters.pickupStartTimeFrom
      });
    }

    if (filters.pickupEndTimeTo) {
      queryBuilder.andWhere('surprise_box.pickupEndTime <= :pickupEndTimeTo', {
        pickupEndTimeTo: filters.pickupEndTimeTo
      });
    }

    if (filters.status) {
      queryBuilder.andWhere('surprise_box.status = :status', { status: filters.status });
    }

    if (filters.reservedBefore) {
      queryBuilder.andWhere('surprise_box.reservedAt <= :reservedBefore', {
        reservedBefore: filters.reservedBefore
      });
    }

    if (filters.reservedAfter) {
      queryBuilder.andWhere('surprise_box.reservedAt >= :reservedAfter', {
        reservedAfter: filters.reservedAfter
      });
    }

    if (filters.createdBefore) {
      queryBuilder.andWhere('surprise_box.createdAt <= :createdBefore', {
        createdBefore: filters.createdBefore
      });
    }

    if (filters.createdAfter) {
      queryBuilder.andWhere('surprise_box.createdAt >= :createdAfter', {
        createdAfter: filters.createdAfter
      });
    }
  }

  validateFilters(filters: EmployeeBoxFiltersDto): void {
    // Валидация цен
    CommonFilters.validatePriceRange(filters.discountedPriceStart, filters.discountedPriceEnd);

    // Валидация дат
    CommonFilters.validateDateRange(filters.createdAfter, filters.createdBefore, 'created');
    CommonFilters.validateDateRange(filters.reservedAfter, filters.reservedBefore, 'reserved');
    CommonFilters.validateDateRange(filters.pickupStartTimeFrom, filters.pickupEndTimeTo, 'pickup');
  }

  getType(): string {
    return 'employee';
  }
}
