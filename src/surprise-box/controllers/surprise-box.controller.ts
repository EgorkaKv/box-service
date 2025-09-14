import { Controller, Get, Param, Query, ParseIntPipe, HttpCode, HttpStatus } from '@nestjs/common';
import { CustomerSurpriseBoxService } from '../services/customer-surprise-box.service';
import { SurpriseBoxService } from '../services/surprise-box.service';
import { PaginatedResponseDto } from '@common/pagination/pagination.dto';
import { SurpriseBoxResponseDto } from '../dto/surprise-box-response.dto';
import {
  GetBoxesByCityFiltersDto,
  GetBoxesByStoreFiltersDto,
  GetNearbyBoxesFiltersDto
} from "../dto/get-surprise-boxes-filters.dto";
import { AppLogger } from '@common/logger/app-logger.service';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';


@ApiTags('Surprise Boxes')
@Controller('boxes')
export class SurpriseBoxController {
  constructor(
    private readonly surpriseBoxService: SurpriseBoxService,
    private readonly customerService: CustomerSurpriseBoxService,
    private readonly logger: AppLogger,
  ) {}

  /**
   * Получить боксы рядом с координатами
   * GET /api/v1/boxes/nearby?latitude=...&longitude=...&radius=...
   */
  @Get('nearby')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get surprise boxes near coordinates' })
  @ApiResponse({ status: 200, description: 'List of nearby boxes' })
  async getNearbyBoxes(
    @Query() filters: GetNearbyBoxesFiltersDto
  ): Promise<PaginatedResponseDto<SurpriseBoxResponseDto>> {
    this.logger.log('Request: Get nearby boxes', 'SurpriseBoxController', {
      latitude: filters.latitude,
      longitude: filters.longitude,
      radius: filters.radius
    });

    const result = await this.customerService.getNearbyBoxes(filters);

    this.logger.log('Response: Nearby boxes retrieved', 'SurpriseBoxController', {
      totalFound: result.pagination.total
    });

    return result;
  }

  /**
   * Получить боксы по городу
   * GET /api/v1/boxes/cities/:cityId
   */
  @Get('cities/:cityId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get surprise boxes by city' })
  async getBoxesByCity(
    @Param('cityId') cityId: string,
    @Query() query: Omit<GetBoxesByCityFiltersDto, 'cityId'>
  ): Promise<PaginatedResponseDto<SurpriseBoxResponseDto>> {
    this.logger.log('Request: Get boxes by city', 'SurpriseBoxController', { cityId });

    const filters: GetBoxesByCityFiltersDto = { ...query, cityId };
    const result = await this.customerService.getBoxesByCity(filters);

    this.logger.log('Response: City boxes retrieved', 'SurpriseBoxController', {
      cityId,
      totalFound: result.pagination.total
    });

    return result;
  }

  /**
   * Получить боксы по магазину
   * GET /api/v1/boxes/stores/:storeId
   */
  @Get('stores/:storeId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get surprise boxes by store' })
  async getBoxesByStore(
    @Param('storeId', ParseIntPipe) storeId: number,
    @Query() query: Omit<GetBoxesByStoreFiltersDto, 'storeId'>
  ): Promise<PaginatedResponseDto<SurpriseBoxResponseDto>> {
    this.logger.log('Request: Get boxes by store', 'SurpriseBoxController', { storeId });

    const filters: GetBoxesByStoreFiltersDto = { ...query, storeId };
    const result = await this.customerService.getBoxesByStore(filters);

    this.logger.log('Response: Store boxes retrieved', 'SurpriseBoxController', {
      storeId,
      totalFound: result.pagination.total
    });

    return result;
  }

  /**
   * Получить конкретный бокс по ID
   * GET /api/v1/boxes/:boxId
   */
  @Get(':boxId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get surprise box by ID' })
  async getBoxById(
    @Param('boxId', ParseIntPipe) boxId: number
  ): Promise<SurpriseBoxResponseDto> {
    this.logger.log('Request: Get box by ID', 'SurpriseBoxController', { boxId });

    const result = await this.surpriseBoxService.getBoxById(boxId);

    this.logger.log('Response: Box retrieved by ID', 'SurpriseBoxController', {
      boxId,
      status: result.status
    });

    return result;
  }
}
