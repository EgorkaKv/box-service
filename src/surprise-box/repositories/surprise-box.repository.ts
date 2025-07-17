import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { SurpriseBox, BoxStatus } from '../entities/surprise-box.entity';
import { SurpriseBoxFilterDto } from '../dto/surprise-box-filter.dto';
import { ReserveBoxDto } from "@order/dto/reserve-box.dto";
import { OperationResult } from "@common/interfaces/operation-result.interface";
import { operationResultHelper } from "@common/interfaces/operation-result.helper";
import { PaginationService } from '@common/pagination/pagination.service';
import { AppLogger } from '@common/logger/app-logger.service';

@Injectable()
export class SurpriseBoxRepository {
  constructor(
    @InjectRepository(SurpriseBox)
    private readonly surpriseBoxRepository: Repository<SurpriseBox>,
    private readonly paginationService: PaginationService,
    private readonly logger: AppLogger,
  ) {}

  /**
   * Универсальный метод поиска с фильтрами и пагинацией
   */
  async findWithFilters(filters: SurpriseBoxFilterDto):
    Promise<{ boxes: SurpriseBox[]; total: number; pagination: any }> {
    this.logger.debug('Finding surprise boxes with filters in database', 'SurpriseBoxRepository', {
      storeId: filters.storeId,
      categoryId: filters.categoryId,
      storeCity: filters.storeCity,
      status: filters.status,
      page: filters.page,
      limit: filters.limit
    });

    const queryBuilder = this.createFilteredQuery(filters);
    const { page, limit } = this.paginationService.validatePaginationParams(filters.page, filters.limit);
    const { skip, take } = this.paginationService.preparePaginationParams(page, limit);

    const [boxes, total] = await queryBuilder
      .skip(skip)
      .take(take)
      .getManyAndCount();

    const totalPages = Math.ceil(total / limit);
    const pagination = {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    };

    this.logger.debug('Query executed with pagination', 'SurpriseBoxRepository', {
      rowsReturned: boxes.length,
      totalFound: total,
      page: pagination.page,
      totalPages: pagination.totalPages
    });

    return { boxes, total, pagination };
  }

  /**
   * Получение активных боксов по геолокации
   */
  async findNearby(latitude: number, longitude: number, radius: number): Promise<SurpriseBox[]> {
    this.logger.debug('Finding boxes by geolocation', 'SurpriseBoxRepository', {
      latitude, longitude, radius
    });

    const query = this.surpriseBoxRepository
      .createQueryBuilder('box')
      .where(`box.status = :status`, { status: BoxStatus.ACTIVE })
      .andWhere(
        `ST_DWithin(
          box.store_location,
          ST_SetSRID(ST_MakePoint(:longitude, :latitude), 4326),
          :radius
        )`,
        { latitude, longitude, radius },
      )
      .andWhere('box.sale_end_time > NOW()')
      .andWhere('box.sale_start_time <= NOW()')
      .orderBy('box.createdAt', 'DESC');

    const boxes = await query.getMany();

    this.logger.debug('Geolocation search completed', 'SurpriseBoxRepository', {
      found: boxes.length,
      latitude, longitude, radius
    });

    return boxes;
  }

  /**
   * Получение активных боксов по городу
   */
  async findByCity(cityId: string): Promise<SurpriseBox[]> {
    this.logger.debug('Finding boxes by city', 'SurpriseBoxRepository', { cityId });

    const boxes = await this.surpriseBoxRepository.find({
      where: {
        storeCity: cityId,
        status: BoxStatus.ACTIVE,
      },
      order: {
        createdAt: 'DESC',
      },
    });

    this.logger.debug('City search completed', 'SurpriseBoxRepository', {
      found: boxes.length,
      cityId
    });

    return boxes;
  }

  /**
   * Получение всех активных боксов
   */
  async findAll(): Promise<SurpriseBox[]> {
    this.logger.debug('Finding all active boxes', 'SurpriseBoxRepository');

    const boxes = await this.surpriseBoxRepository.find({
      where: {
        status: BoxStatus.ACTIVE,
      },
    });

    this.logger.debug('All boxes search completed', 'SurpriseBoxRepository', {
      found: boxes.length
    });

    return boxes;
  }

  /**
   * Получение конкретного бокса по ID
   */
  async findById(boxId: number): Promise<SurpriseBox | null> {
    this.logger.debug('Finding box by ID', 'SurpriseBoxRepository', { boxId });

    const box = await this.surpriseBoxRepository.findOne({
      where: { id: boxId },
      relations: ['store', 'category', 'boxTemplate'],
    });

    this.logger.debug('Box search by ID completed', 'SurpriseBoxRepository', {
      boxId,
      found: !!box,
      status: box?.status
    });

    return box;
  }

  /**
   * Получение доступных для покупки боксов
   * Вспомогательный метод для других запросов
   */
  async findAvailable(): Promise<SurpriseBox[]> {
    return this.surpriseBoxRepository
      .createQueryBuilder('box')
      .where('box.status = :status', { status: BoxStatus.ACTIVE })
      .andWhere('box.sale_start_time <= NOW()')
      .andWhere('box.sale_end_time > NOW()')
      .getMany();
  }

  async findActiveBoxesByStore(storeId: number): Promise<SurpriseBox[]> {
    this.logger.debug('Finding active boxes by store', 'SurpriseBoxRepository', { storeId });

    const boxes = await this.surpriseBoxRepository.find({
      where: {
        storeId,
        status: BoxStatus.ACTIVE,
      },
      relations: ['boxTemplate', 'store', 'category'],
      order: {
        createdAt: 'DESC',
      },
    });

    this.logger.debug('Store boxes search completed', 'SurpriseBoxRepository', {
      storeId,
      found: boxes.length
    });

    return boxes;
  }

  /**
   * Вызов атомарной функции резервирования
   */
  async reserveBoxAtomic(reserveBoxDto: ReserveBoxDto): Promise<OperationResult<{expiresAt: string}>> {
    this.logger.debug('Executing reserve_surprise_box_atomic function', 'SurpriseBoxRepository', {
      boxId: reserveBoxDto.surpriseBoxId,
      customerId: reserveBoxDto.customerId,
      reservationMinutes: reserveBoxDto.reservationMinutes
    });

    const result = await this.surpriseBoxRepository.query(
      'SELECT * FROM reserve_surprise_box_atomic($1, $2, $3)', [
        reserveBoxDto.surpriseBoxId,
        reserveBoxDto.customerId,
        reserveBoxDto.reservationMinutes,
      ]
    );

    const queryResult = operationResultHelper(result[0]);

    this.logger.debug('Database function executed', 'SurpriseBoxRepository', {
      success: queryResult.success,
      boxId: reserveBoxDto.surpriseBoxId,
      customerId: reserveBoxDto.customerId,
      expiresAt: queryResult.data?.expiresAt
    });

    return queryResult;
  }

  private createFilteredQuery(filters: SurpriseBoxFilterDto): SelectQueryBuilder<SurpriseBox> {
    const queryBuilder = this.surpriseBoxRepository
      .createQueryBuilder('box')
      .leftJoinAndSelect('box.store', 'store')
      .leftJoinAndSelect('box.category', 'category')
      .leftJoinAndSelect('box.boxTemplate', 'boxTemplate');

    // Применяем фильтры
    this.applyFilters(queryBuilder, filters);

    // Применяем сортировку
    this.applySorting(queryBuilder, filters);

    return queryBuilder;
  }

  private applyFilters(queryBuilder: SelectQueryBuilder<SurpriseBox>, filters: SurpriseBoxFilterDto): void {
    if (filters.storeId) {
      queryBuilder.andWhere('box.storeId = :storeId', { storeId: filters.storeId });
    }

    if (filters.categoryId) {
      queryBuilder.andWhere('box.categoryId = :categoryId', { categoryId: filters.categoryId });
    }

    if (filters.storeCity) {
      queryBuilder.andWhere('box.storeCity = :storeCity', { storeCity: filters.storeCity });
    }

    if (filters.status) {
      queryBuilder.andWhere('box.status = :status', { status: filters.status });
    }

    if (filters.priceFrom) {
      queryBuilder.andWhere('box.discountedPrice >= :priceFrom', { priceFrom: filters.priceFrom });
    }

    if (filters.priceTo) {
      queryBuilder.andWhere('box.discountedPrice <= :priceTo', { priceTo: filters.priceTo });
    }

    if (filters.saleStartFrom) {
      queryBuilder.andWhere('box.saleStartTime >= :saleStartFrom', { saleStartFrom: filters.saleStartFrom });
    }

    if (filters.saleStartTo) {
      queryBuilder.andWhere('box.saleStartTime <= :saleStartTo', { saleStartTo: filters.saleStartTo });
    }

    if (filters.saleEndFrom) {
      queryBuilder.andWhere('box.saleEndTime >= :saleEndFrom', { saleEndFrom: filters.saleEndFrom });
    }

    if (filters.saleEndTo) {
      queryBuilder.andWhere('box.saleEndTime <= :saleEndTo', { saleEndTo: filters.saleEndTo });
    }

    if (filters.search) {
      queryBuilder.andWhere(
        '(box.title ILIKE :search OR box.description ILIKE :search)',
        { search: `%${filters.search}%` }
      );
    }

    // Геолокационные фильтры
    if (filters.latitude && filters.longitude && filters.radius) {
      queryBuilder.andWhere(
        `ST_DWithin(
          box.store_location,
          ST_SetSRID(ST_MakePoint(:longitude, :latitude), 4326),
          :radius
        )`,
        {
          latitude: filters.latitude,
          longitude: filters.longitude,
          radius: filters.radius
        }
      );
    }
  }

  private applySorting(queryBuilder: SelectQueryBuilder<SurpriseBox>, filters: SurpriseBoxFilterDto): void {
    const sortBy = filters.sortBy || 'createdAt';
    const sortOrder = filters.sortOrder || 'DESC';

    // Маппинг полей для сортировки
    const sortFieldMap = {
      'createdAt': 'box.createdAt',
      'saleStartTime': 'box.saleStartTime',
      'saleEndTime': 'box.saleEndTime',
      'discountedPrice': 'box.discountedPrice',
      'originalPrice': 'box.originalPrice',
    };

    const sortField = sortFieldMap[sortBy] || 'box.createdAt';
    queryBuilder.orderBy(sortField, sortOrder);
  }
}