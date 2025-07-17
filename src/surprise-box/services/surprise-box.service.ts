import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { SurpriseBoxRepository } from '../repositories/surprise-box.repository';
import { SurpriseBoxResponseDto } from '../dto/surprise-box-response.dto';
import { SurpriseBoxFilterDto } from '../dto/surprise-box-filter.dto';
import { ReserveBoxDto } from "@order/dto/reserve-box.dto";
import { OperationResult } from "@common/interfaces/operation-result.interface";
import { PaginatedResponseDto } from '@common/pagination/pagination.dto';
import { PaginationService } from '@common/pagination/pagination.service';
import { SurpriseBoxMapper } from '../entities/surprise-box.mapper';
import { AppLogger } from '@common/logger/app-logger.service';

@Injectable()
export class SurpriseBoxService {
  constructor(
    private readonly surpriseBoxRepository: SurpriseBoxRepository,
    private readonly paginationService: PaginationService,
    private readonly logger: AppLogger,
  ) {}

  /**
   * Универсальный метод поиска боксов с фильтрами и пагинацией
   */
  async findBoxesWithFilters(filters: SurpriseBoxFilterDto): Promise<PaginatedResponseDto<SurpriseBoxResponseDto>> {
    this.logger.log('Fetching surprise boxes with filters', 'SurpriseBoxService');

    const { boxes, total, pagination } = await this.surpriseBoxRepository.findWithFilters(filters);

    // Преобразуем боксы в DTO
    const boxesDto = boxes.map(box => SurpriseBoxMapper.toSurpriseBoxResponseDto(box));

    // Извлекаем активные фильтры
    const activeFilters = this.paginationService.extractActiveFilters(filters);

    this.logger.log('Surprise boxes retrieved successfully', 'SurpriseBoxService', {
      totalFound: total,
      returnedCount: boxesDto.length
    });

    // Создаем пагинированный ответ
    return this.paginationService.createPaginatedResponse(
      boxesDto,
      total,
      pagination.page,
      pagination.limit,
      filters.sortBy,
      filters.sortOrder,
      activeFilters
    );
  }

  /**
   * Получить боксы рядом с заданными координатами
   */
  async getNearbyBoxes(latitude: number, longitude: number, radius: number): Promise<SurpriseBoxResponseDto[]> {
    this.logger.log('Fetching nearby boxes', 'SurpriseBoxService', { latitude, longitude, radius });

    if (!latitude || !longitude || !radius) {
      throw new BadRequestException('Latitude, longitude and radius are required');
    }

    if (radius <= 0 || radius > 50000) { // максимум 50км
      throw new BadRequestException('Radius must be between 1 and 50000 meters');
    }

    const boxes = await this.surpriseBoxRepository.findNearby(latitude, longitude, radius);
    const boxesDto = boxes.map(box => SurpriseBoxMapper.toSurpriseBoxResponseDto(box));

    this.logger.log('Nearby boxes retrieved successfully', 'SurpriseBoxService', {
      found: boxesDto.length,
      latitude, longitude, radius
    });

    return boxesDto;
  }

  /**
   * Получить боксы по идентификатору города
   */
  async getBoxesByCity(cityId: string): Promise<SurpriseBoxResponseDto[]> {
    this.logger.log('Fetching boxes by city', 'SurpriseBoxService', { cityId });

    if (!cityId || cityId.trim() === '') {
      throw new BadRequestException('City ID is required');
    }

    const boxes = await this.surpriseBoxRepository.findByCity(cityId);
    const boxesDto = boxes.map(box => SurpriseBoxMapper.toSurpriseBoxResponseDto(box));

    this.logger.log('Boxes by city retrieved successfully', 'SurpriseBoxService', {
      found: boxesDto.length,
      cityId
    });

    return boxesDto;
  }

  /**
   * Получить все активные боксы
   */
  async getAllBoxes(): Promise<SurpriseBoxResponseDto[]> {
    this.logger.log('Fetching all active boxes', 'SurpriseBoxService');

    const boxes = await this.surpriseBoxRepository.findAll();
    const boxesDto = boxes.map(box => SurpriseBoxMapper.toSurpriseBoxResponseDto(box));

    this.logger.log('All active boxes retrieved successfully', 'SurpriseBoxService', {
      found: boxesDto.length
    });

    return boxesDto;
  }

  /**
   * Получить бокс по идентификатору
   */
  async getBoxById(boxId: number): Promise<SurpriseBoxResponseDto> {
    this.logger.log('Fetching box by ID', 'SurpriseBoxService');

    if (!boxId || boxId <= 0) {
      throw new BadRequestException('Valid box ID is required');
    }

    const box = await this.surpriseBoxRepository.findById(boxId);

    if (!box) {
      this.logger.debug('Box not found', 'SurpriseBoxService', { boxId });
      throw new NotFoundException(`Box with ID ${boxId} not found`);
    }

    this.logger.log('Box retrieved successfully', 'SurpriseBoxService', {
      boxId: box.id,
      status: box.status
    });

    return SurpriseBoxMapper.toSurpriseBoxResponseDto(box);
  }

  /**
   * Проверить существование бокса по идентификатору
   */
  async checkIfBoxExists(boxId: number): Promise<boolean> {
    this.logger.log('Checking if box exists', 'SurpriseBoxService', { boxId });

    if (!boxId || boxId <= 0) {
      return false;
    }

    const box = await this.surpriseBoxRepository.findById(boxId);
    const exists = !!box;

    this.logger.log('Box existence check completed', 'SurpriseBoxService', {
      boxId,
      exists
    });

    return exists;
  }

  /**
   * Получить активные боксы по идентификатору магазина
   */
  async getActiveBoxesByStore(storeId: number): Promise<SurpriseBoxResponseDto[]> {
    this.logger.log('Fetching active boxes by store', 'SurpriseBoxService', { storeId });

    if (!storeId || storeId <= 0) {
      throw new BadRequestException('Valid store ID is required');
    }

    const boxes = await this.surpriseBoxRepository.findActiveBoxesByStore(storeId);
    const boxesDto = boxes.map(box => SurpriseBoxMapper.toSurpriseBoxResponseDto(box));

    this.logger.log('Active boxes by store retrieved successfully', 'SurpriseBoxService', {
      storeId,
      found: boxesDto.length
    });

    return boxesDto;
  }

  /**
   * Зарезервировать бокс для заказа
   */
  async reserveBox(reserveBoxDto: ReserveBoxDto): Promise<OperationResult<{expiresAt: string}>> {
    this.logger.log('Starting box reservation process', 'SurpriseBoxService', {
      boxId: reserveBoxDto.surpriseBoxId,
      customerId: reserveBoxDto.customerId
    });

    if (!reserveBoxDto.surpriseBoxId || reserveBoxDto.surpriseBoxId <= 0) {
      throw new BadRequestException('Valid surprise box ID is required');
    }

    if (!reserveBoxDto.customerId || reserveBoxDto.customerId <= 0) {
      throw new BadRequestException('Valid customer ID is required');
    }

    if (!reserveBoxDto.reservationMinutes || reserveBoxDto.reservationMinutes <= 0) {
      throw new BadRequestException('Valid reservation minutes is required');
    }

    const result = await this.surpriseBoxRepository.reserveBoxAtomic(reserveBoxDto);

    if (result.success) {
      this.logger.log('Box reservation completed successfully', 'SurpriseBoxService', {
        boxId: reserveBoxDto.surpriseBoxId,
        customerId: reserveBoxDto.customerId,
        expiresAt: result.data?.expiresAt
      });
    } else {
      this.logger.debug('Box reservation failed', 'SurpriseBoxService', {
        boxId: reserveBoxDto.surpriseBoxId,
        customerId: reserveBoxDto.customerId,
        reason: result.message
      });
    }

    return result;
  }

  /**
   * Получить боксы по магазину с пагинацией
   */
  async getBoxesByStore(storeId: number, page: number, limit: number): Promise<PaginatedResponseDto<SurpriseBoxResponseDto>> {
    const filters = this.createBoxFilters(
      { storeId },
      page,
      limit,
      SurpriseBoxService.DEFAULT_SORT_CONFIG
    );

    this.logger.log('Finding boxes by store with pagination', 'SurpriseBoxService', { storeId, page, limit });

    return await this.findBoxesWithFilters(filters);
  }

  /**
   * Получить боксы по категории с пагинацией
   */
  async getBoxesByCategory(categoryId: number, page: number, limit: number): Promise<PaginatedResponseDto<SurpriseBoxResponseDto>> {
    const filters = this.createBoxFilters(
      { categoryId },
      page,
      limit,
      SurpriseBoxService.DEFAULT_SORT_CONFIG
    );

    this.logger.log('Finding boxes by category with pagination', 'SurpriseBoxService', { categoryId, page, limit });

    return await this.findBoxesWithFilters(filters);
  }

  private static readonly DEFAULT_SORT_CONFIG = {
    sortBy: 'createdAt' as const,
    sortOrder: 'DESC' as const
  };

  private createBoxFilters(
    baseFilters: Partial<SurpriseBoxFilterDto>,
    page: number,
    limit: number,
    sortConfig = SurpriseBoxService.DEFAULT_SORT_CONFIG
  ): SurpriseBoxFilterDto {
    return {
      ...baseFilters,
      page,
      limit,
      ...sortConfig
    };
  }
}