import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Query,
  ParseFloatPipe
} from '@nestjs/common';
import { SurpriseBoxService } from '../services/surprise-box.service';
import { SurpriseBoxResponseDto } from '../dto/surprise-box-response.dto';
import { PaginatedResponseDto } from '@common/pagination/pagination.dto';
import { AppLogger } from '@common/logger/app-logger.service';

@Controller('boxes')
export class SurpriseBoxController {
  constructor(
    private readonly surpriseBoxService: SurpriseBoxService,
    private readonly logger: AppLogger,
  ) {}

  /**
   * Получить боксы рядом с заданными координатами
   */
  @Get('nearby')
  async getNearbyBoxes(
    @Query('latitude', ParseFloatPipe) latitude: number,
    @Query('longitude', ParseFloatPipe) longitude: number,
    @Query('radius', ParseFloatPipe) radius: number,
  ): Promise<SurpriseBoxResponseDto[]> {
    this.logger.log('Received request to get nearby boxes', 'SurpriseBoxController');

    const result = await this.surpriseBoxService.getNearbyBoxes(latitude, longitude, radius);

    this.logger.log('Nearby boxes request completed', 'SurpriseBoxController');
    return result;
  }

  /**
   * Получить боксы по городу
   */
  @Get('city/:cityId')
  async getBoxesByCity(@Param('cityId') cityId: string): Promise<SurpriseBoxResponseDto[]> {
    this.logger.log('Received request to get boxes by city', 'SurpriseBoxController');

    const result = await this.surpriseBoxService.getBoxesByCity(cityId);

    this.logger.log('Boxes by city request completed', 'SurpriseBoxController');
    return result;
  }

  /**
   * Получить все активные боксы
   */
  @Get('all')
  async getAllBoxes(): Promise<SurpriseBoxResponseDto[]> {
    this.logger.log('Received request to get all boxes', 'SurpriseBoxController');

    const result = await this.surpriseBoxService.getAllBoxes();

    this.logger.log('All boxes request completed', 'SurpriseBoxController');
    return result;
  }

  /**
   * Получить активные боксы по магазину с пагинацией
   */
  @Get('store/:storeId')
  async getActiveBoxesByStore(
    @Param('storeId', ParseIntPipe) storeId: number,
    @Query('page', ParseIntPipe) page: number = 1,
    @Query('limit', ParseIntPipe) limit: number = 20
  ): Promise<PaginatedResponseDto<SurpriseBoxResponseDto>> {
    this.logger.log('Received request to get active boxes by store', 'SurpriseBoxController');

    const result = await this.surpriseBoxService.getBoxesByStore(storeId, page, limit);

    this.logger.log('Active boxes by store request completed', 'SurpriseBoxController');
    return result;
  }

  /**
   * Получить боксы по категории с пагинацией
   */
  @Get('category/:categoryId')
  async getBoxesByCategory(
    @Param('categoryId', ParseIntPipe) categoryId: number,
    @Query('page', ParseIntPipe) page: number = 1,
    @Query('limit', ParseIntPipe) limit: number = 20
  ): Promise<PaginatedResponseDto<SurpriseBoxResponseDto>> {
    this.logger.log('Received request to get boxes by category', 'SurpriseBoxController');

    const result = await this.surpriseBoxService.getBoxesByCategory(categoryId, page, limit);

    this.logger.log('Boxes by category request completed', 'SurpriseBoxController');
    return result;
  }

  /**
   * Получить конкретный бокс по ID
   */
  @Get(':boxId')
  async getBoxById(@Param('boxId', ParseIntPipe) boxId: number): Promise<SurpriseBoxResponseDto> {
    this.logger.log('Received request to get box by ID', 'SurpriseBoxController');

    const result = await this.surpriseBoxService.getBoxById(boxId);

    this.logger.log('Get box by ID request completed', 'SurpriseBoxController');
    return result;
  }
}