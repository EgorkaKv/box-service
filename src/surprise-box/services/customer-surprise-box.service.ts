import { Injectable } from '@nestjs/common';
import { SurpriseBoxRepository } from '../repositories/surprise-box.repository';
import { SurpriseBoxResponseDto } from '../dto/surprise-box-response.dto';
import { PaginatedResponseDto } from '@common/pagination/pagination.dto';
import { PaginationService } from '@common/pagination/pagination.service';
import { SurpriseBoxMapper } from '../entities/surprise-box.mapper';
import { AppLogger } from '@common/logger/app-logger.service';
import {
  GetNearbyBoxesFiltersDto,
  GetBoxesByCityFiltersDto,
  GetBoxesByStoreFiltersDto,
  BaseSurpriseBoxFiltersDto,
} from "../dto/get-surprise-boxes-filters.dto";
import {SurpriseBoxSearchService} from "@surprise-box/services/surprise-box-search.service";

/**
 * Сервис для клиентских операций с surprise boxes
 * Использует композицию вместо наследования
 */
@Injectable()
export class CustomerSurpriseBoxService {
  constructor(
    private readonly searchService: SurpriseBoxSearchService, // Делегируем поиск
    private readonly paginationService: PaginationService,
    private readonly logger: AppLogger,
  ) {}

  /**
   * Универсальный метод поиска боксов для клиентов (только активные боксы)
   */
  async findBoxesWithFilters(filters: BaseSurpriseBoxFiltersDto): Promise<PaginatedResponseDto<SurpriseBoxResponseDto>> {
    this.logger.log('Fetching surprise boxes for customer with filters', 'CustomerSurpriseBoxService');

    // Делегируем поиск специализированному сервису
    const { boxes, pagination } = await this.searchService.findBoxesForCustomers(filters);

    // Преобразуем боксы в DTO
    const boxesDto = boxes.map(box => SurpriseBoxMapper.toSurpriseBoxResponseDto(box));

    // Извлекаем активные фильтры
    const activeFilters = this.paginationService.extractActiveFilters(filters);

    this.logger.debug('Customer surprise boxes retrieved successfully', 'CustomerSurpriseBoxService', {
      totalFound: pagination.total,
      returnedCount: boxesDto.length
    });

    // Создаем пагинированный ответ
    return this.paginationService.createPaginatedResponse(
      boxesDto,
      pagination,
      filters.sortBy,
      filters.sortOrder,
      activeFilters
    );
  }

  /**
   * Получить боксы рядом с заданными координатами
   */
  async getNearbyBoxes(filters: GetNearbyBoxesFiltersDto): Promise<PaginatedResponseDto<SurpriseBoxResponseDto>> {
    this.logger.log('Processing nearby boxes request', 'CustomerSurpriseBoxService', {
      latitude: filters.latitude,
      longitude: filters.longitude,
      radius: filters.radius
    });
    return this.findBoxesWithFilters(filters);
  }

  /**
   * Получить боксы по городу
   */
  async getBoxesByCity(filters: GetBoxesByCityFiltersDto): Promise<PaginatedResponseDto<SurpriseBoxResponseDto>> {
    this.logger.log('Fetching boxes by city for customer', 'CustomerSurpriseBoxService');
    return this.findBoxesWithFilters(filters);
  }

  /**
   * Получить боксы по магазину
   */
  async getBoxesByStore(filters: GetBoxesByStoreFiltersDto): Promise<PaginatedResponseDto<SurpriseBoxResponseDto>> {
    this.logger.log('Fetching boxes by store for customer', 'CustomerSurpriseBoxService');
    return this.findBoxesWithFilters(filters);
  }
}
