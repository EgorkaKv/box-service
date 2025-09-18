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
import { ApiTags, ApiOperation, ApiParam, ApiOkResponse, ApiBadRequestResponse, ApiNotFoundResponse, ApiInternalServerErrorResponse} from '@nestjs/swagger';


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
  @ApiOperation({
    summary: 'Get surprise boxes near coordinates',
    description: `
      Get list of surprise boxes near specified coordinates.
      
      Supports geolocation search within radius from 100m to 20km with ability 
      to filter by category, price, pickup time and text search.
    `
  })
  @ApiOkResponse({
    description: 'List of boxes successfully retrieved',
    type: PaginatedResponseDto<SurpriseBoxResponseDto>
  })
  @ApiBadRequestResponse({
    description: 'Invalid request parameters',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 400 },
        message: {
          type: 'array',
          items: { type: 'string' },
          example: ['latitude must be between -90 and 90', 'radius must be at least 100 meters']
        },
        error: { type: 'string', example: 'Bad Request' }
      }
    }
  })
  @ApiInternalServerErrorResponse({ description: 'Internal server error' })
  @Get('nearby')
  @HttpCode(HttpStatus.OK)
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
  @ApiOperation({
    summary: 'Get surprise boxes by city',
    description: `
      Get list of surprise boxes in specified city.
      
      Search is performed across all stores in the city with support for standard 
      filters: category, price, pickup time, text search.
    `
  })
  @ApiParam({
    name: 'cityId',
    description: 'City identifier',
    example: 'lviv',
    type: String
  })
  @ApiOkResponse({
    description: 'List of boxes in city successfully retrieved',
    type: PaginatedResponseDto<SurpriseBoxResponseDto>
  })
  @ApiBadRequestResponse({
    description: 'Invalid parameters or unknown city',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 400 },
        message: { type: 'string', example: 'cityId is required' },
        error: { type: 'string', example: 'Bad Request' }
      }
    }
  })
  @ApiNotFoundResponse({
    description: 'City not found',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 404 },
        message: { type: 'string', example: 'No boxes found in city: lviv' },
        error: { type: 'string', example: 'Not Found' }
      }
    }
  })
  @Get('cities/:cityId')
  @HttpCode(HttpStatus.OK)
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
  @ApiOperation({
    summary: 'Get surprise boxes by store',
    description: `
      Get all available surprise boxes from specific store.
      
      Used to view all offers from particular establishment 
      with filtering and sorting capabilities.
    `
  })
  @ApiParam({
    name: 'storeId',
    description: 'Store identifier',
    example: 1,
    type: Number
  })
  @ApiOkResponse({
    description: 'List of store boxes successfully retrieved',
    type: PaginatedResponseDto<SurpriseBoxResponseDto>
  })
  @ApiBadRequestResponse({
    description: 'Invalid store ID',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 400 },
        message: { type: 'string', example: 'Validation failed (numeric string is expected)' },
        error: { type: 'string', example: 'Bad Request' }
      }
    }
  })
  @ApiNotFoundResponse({
    description: 'Store not found or has no active boxes',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 404 },
        message: { type: 'string', example: 'Store with ID 1 not found or has no active boxes' },
        error: { type: 'string', example: 'Not Found' }
      }
    }
  })
  @Get('stores/:storeId')
  @HttpCode(HttpStatus.OK)
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
  @ApiOperation({
    summary: 'Get surprise box by ID',
    description: `
      Get detailed information about specific surprise box.
      
      Returns complete information including store data, category, 
      reservation status and sale/pickup timeframes.
    `
  })
  @ApiParam({
    name: 'boxId',
    description: 'Unique surprise box identifier',
    example: 42,
    type: Number
  })
  @ApiOkResponse({
    description: 'Detailed box information successfully retrieved',
    type: SurpriseBoxResponseDto
  })
  @ApiBadRequestResponse({
    description: 'Invalid box ID',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 400 },
        message: { type: 'string', example: 'Validation failed (numeric string is expected)' },
        error: { type: 'string', example: 'Bad Request' }
      }
    }
  })
  @ApiNotFoundResponse({
    description: 'Box not found',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 404 },
        message: { type: 'string', example: 'Surprise box with ID 42 not found' },
        error: { type: 'string', example: 'Not Found' }
      }
    }
  })
  @Get(':boxId')
  @HttpCode(HttpStatus.OK)
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
