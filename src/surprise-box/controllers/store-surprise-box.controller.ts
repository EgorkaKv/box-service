import {Body, Controller, Post, Request, UseGuards, UsePipes, ValidationPipe,
  Get, Query, HttpCode, HttpStatus } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { EmployeeJwtAuthGuard } from "@auth/guards/employee-jwt-auth.guard";
import { EmployeeSurpriseBoxService } from "@surprise-box/services/employee-surprise-box.service";
import { CreateBoxDto } from "@surprise-box/dto/create-box.dto";
import { EmployeeBoxFiltersDto } from "@surprise-box/dto/employee-box-filters.dto";
import { PaginatedResponseDto } from "@common/pagination/pagination.dto";
import { SurpriseBoxResponseDto } from "@surprise-box/dto/surprise-box-response.dto";
import { AppLogger } from "@common/logger/app-logger.service";
import { EmployeeRole } from "@auth/entities/store-credential.entity";

/**
 * Интерфейс для данных пользователя из JWT
 */
interface EmployeeUser {
  credentialId: number;
  storeId: number;
  login: string;
  type: EmployeeRole;
}

/**
 * Интерфейс для request с пользователем
 */
interface RequestWithUser extends Request {
  user: EmployeeUser;
}

/**
 * DTO для ответа создания боксов
 */
interface CreateBoxResponse {
  ids: number[];
  count: number;
  message: string;
}

/**
 * Контроллер для управления surprise boxes работниками магазина
 */
@ApiTags('Store Management - Surprise Boxes')
@ApiBearerAuth()
@Controller('api/v1/store/boxes')
@UseGuards(EmployeeJwtAuthGuard)
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
export class StoreSurpriseBoxController {
  constructor(
    private readonly employeeService: EmployeeSurpriseBoxService,
    private readonly logger: AppLogger
  ) {}

  /**
   * Получить боксы магазина с фильтрами для работников
   * GET /api/v1/store/boxes?page=1&limit=20&boxTemplateId=...&status=...
   */
  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get store surprise boxes for employees',
    description: 'Retrieve paginated list of surprise boxes for the authenticated employee\'s store with filtering options'
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved store boxes',
    type: PaginatedResponseDto<SurpriseBoxResponseDto>
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  async getBoxesForEmployee(
    @Request() req: RequestWithUser,
    @Query() filters: EmployeeBoxFiltersDto
  ): Promise<PaginatedResponseDto<SurpriseBoxResponseDto>> {
    const { storeId, login, type } = req.user;

    this.logger.log('Request: Get boxes for employee', 'StoreSurpriseBoxController', {
      storeId,
      employeeLogin: login,
      employeeType: type,
      page: filters.page,
      limit: filters.limit,
      hasFilters: Object.keys(filters).length > 0
    });

    const result = await this.employeeService.getBoxesForEmployee(storeId, filters);

    this.logger.log('Response: Employee boxes retrieved successfully', 'StoreSurpriseBoxController', {
      storeId,
      totalFound: result.pagination.total,
      returnedCount: result.data.length,
      page: result.pagination.page
    });

    return result;
  }

  /**
   * Создать новые surprise boxes из шаблона
   * POST /api/v1/store/boxes
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create new surprise boxes from template',
    description: 'Create multiple surprise boxes based on a box template. Only employees with appropriate permissions can create boxes.'
  })
  @ApiBody({
    description: 'Box creation parameters',
    type: CreateBoxDto
  })
  @ApiResponse({
    status: 201,
    description: 'Boxes created successfully',
    schema: {
      type: 'object',
      properties: {
        ids: {
          type: 'array',
          items: { type: 'number' },
          description: 'Array of created box IDs'
        },
        count: {
          type: 'number',
          description: 'Number of boxes created'
        },
        message: {
          type: 'string',
          description: 'Success message'
        }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Bad Request - Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Not Found - Box template not found' })
  async createBoxes(
    @Request() req: RequestWithUser,
    @Body() createBoxDto: CreateBoxDto
  ): Promise<CreateBoxResponse> {
    const { storeId, login, type } = req.user;

    this.logger.log('Request: Create surprise boxes', 'StoreSurpriseBoxController', {
      storeId,
      employeeLogin: login,
      employeeType: type,
      templateId: createBoxDto.templateId,
      count: createBoxDto.count
    });

    const result = await this.employeeService.createBox(createBoxDto);

    const response: CreateBoxResponse = {
      ids: result.ids,
      count: result.ids.length,
      message: `Successfully created ${result.ids.length} surprise boxes`
    };

    this.logger.log('Response: Boxes created successfully', 'StoreSurpriseBoxController', {
      storeId,
      templateId: createBoxDto.templateId,
      createdCount: response.count,
      createdIds: response.ids
    });

    return response;
  }
}