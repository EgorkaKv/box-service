import { Injectable, NotFoundException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { SurpriseBoxRepository } from '../repositories/surprise-box.repository';
import { SurpriseBoxResponseDto } from '../dto/surprise-box-response.dto';
import { PaginatedResponseDto } from '@common/pagination/pagination.dto';
import { PaginationService } from '@common/pagination/pagination.service';
import { SurpriseBoxMapper } from '../entities/surprise-box.mapper';
import { AppLogger } from '@common/logger/app-logger.service';
import { BoxTemplateRepository } from "@box-template/repositories/box-template.repository";
import { CreateBoxDto } from "../dto/create-box.dto";
import { EmployeeBoxFiltersDto } from '../dto/employee-box-filters.dto';
import {SurpriseBoxService} from "@surprise-box/services/surprise-box.service";
import {SurpriseBoxSearchService} from "@surprise-box/services/surprise-box-search.service";

@Injectable()
export class EmployeeSurpriseBoxService extends SurpriseBoxService {
  constructor(
    private readonly searchService: SurpriseBoxSearchService, // Делегируем поиск
    protected readonly surpriseBoxRepository: SurpriseBoxRepository,
    private readonly boxTemplateRepository: BoxTemplateRepository,
    private readonly paginationService: PaginationService,
    protected readonly logger: AppLogger,
  ) {
    super(surpriseBoxRepository, logger);
  }

  /**
   * Получить боксы для работников магазина с расширенными фильтрами
   */
  async getBoxesForEmployee(storeId: number, filters: EmployeeBoxFiltersDto): Promise<PaginatedResponseDto<SurpriseBoxResponseDto>> {
    this.logger.log(`Fetching boxes for employee from store ${storeId}`, 'EmployeeSurpriseBoxService');

    // Делегируем поиск специализированному сервису
    const { boxes, pagination } = await this.searchService.findBoxesForEmployees(storeId, filters);

    // Преобразуем боксы в DTO
    const boxesDto = boxes.map(box => SurpriseBoxMapper.toSurpriseBoxResponseDto(box));

    // Извлекаем активные фильтры
    const activeFilters = this.paginationService.extractActiveFilters(filters);

    this.logger.log('Employee boxes retrieved successfully', 'EmployeeSurpriseBoxService', {
      totalFound: pagination.total,
      returnedCount: boxesDto.length,
      storeId
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
   * Создать новый набор surprise box
   */
  async createBox(createBoxDto: CreateBoxDto): Promise<{ids: number[]}> {
    this.logger.log('Starting box creating process', 'EmployeeSurpriseBoxService');

    const templateId = createBoxDto.templateId;
    const count = createBoxDto.count;

    // Проверяем, что шаблон существует
    const boxTemplate = await this.boxTemplateRepository.findById(templateId);
    if (!boxTemplate) {
      this.logger.debug(`Box template with id: ${templateId} not found`, 'EmployeeSurpriseBoxService');
      throw new NotFoundException('Box template not found', {description: `templateId: ${templateId}`});
    }

    const result = await this.surpriseBoxRepository.createBoxFromTemplate(templateId, count);
    if (!result.success) {
      this.logger.debug(`Exception while executing db function: ${result.message}`, 'EmployeeSurpriseBoxService');
      throw new InternalServerErrorException(result.message);
    }

    this.logger.log('Box creating successfully finished', 'EmployeeSurpriseBoxService', {
      createdCount: result.data?.ids.length
    });

    return result.data!;
  }
}

