import {Controller, Post, Body, UseGuards, Req, Query, Get, Param, HttpCode, HttpStatus} from '@nestjs/common';
import { CompleteOrderDto } from '../dto/complete-order.dto';
import { EmployeeJwtAuthGuard } from '@auth/guards/employee-jwt-auth.guard';
import { AppLogger } from '@common/logger/app-logger.service';
import { PaginatedResponseDto } from "@common/pagination/pagination.dto";
import { OrderResponseDto } from "@order/dto/order-response.dto";
import { EmployeeOrderService } from "@order/services/employee-order.service";
import { OrderFilterDto } from "@order/dto/order-filter.dto";
import { StoreOrderOwnershipGuard } from '../guards/order-ownership.guard';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";

/**
 * Интерфейс для работника из JWT
 */
interface EmployeeUser {
  id: number;
  email: string;
  storeId: number;
}

interface RequestWithEmployee extends Request {
  user: EmployeeUser;
  storeId: number;
}

/**
 * Контроллер для управления заказами работниками магазинов
 * следует REST принципам и единообразной структуре API
 */
@ApiTags('Store Employee Orders')
@ApiBearerAuth()
@Controller('api/v1/orders/employee')
export class StoreOrderController {
  constructor(
    private readonly employeeOrderService: EmployeeOrderService,
    private readonly logger: AppLogger,
  ) {}

  /**
   * Завершение заказа магазином
   * POST /api/v1/orders/employee/complete
   */
  @Post('complete')
  @HttpCode(HttpStatus.OK)
  @UseGuards(EmployeeJwtAuthGuard, StoreOrderOwnershipGuard)
  @ApiOperation({
    summary: 'Complete order by store employee',
    description: 'Mark an order as completed using pickup code verification'
  })
  @ApiResponse({ status: 200, description: 'Order completed successfully' })
  @ApiResponse({ status: 400, description: 'Invalid pickup code or order data' })
  @ApiResponse({ status: 403, description: 'Access denied to this order' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async completeOrder(
    @Req() req: RequestWithEmployee,
    @Body() completeOrderDto: CompleteOrderDto
  ): Promise<void> {
    this.logger.log('Received request to complete order', 'StoreOrderController');

    const storeId = req.storeId;
    await this.employeeOrderService.completeOrder(
      completeOrderDto.orderId,
      completeOrderDto.pickupCode,
      storeId
    );

    this.logger.log('Complete order request completed', 'StoreOrderController');
  }


  // FIXME: не понятно что возвращает этот роут, нужно уточнить
  /**
   * Получить заказы магазина
   * GET /api/v1/orders/employee/store
   */
  @Get('store')
  @HttpCode(HttpStatus.OK)
  @UseGuards(EmployeeJwtAuthGuard)
  @ApiOperation({
    summary: 'Get store orders',
    description: 'Retrieve paginated list of orders for the employee\'s store'
  })
  @ApiResponse({
    status: 200,
    description: 'Store orders retrieved successfully',
    type: PaginatedResponseDto<OrderResponseDto>
  })
  @ApiResponse({ status: 403, description: 'Access denied' })
  async getStoreOrders(
    @Req() req: RequestWithEmployee,
    @Query() filters: OrderFilterDto
  ): Promise<PaginatedResponseDto<OrderResponseDto>> {
    this.logger.log('Received request to get store orders', 'StoreOrderController');

    const storeId = req.user.storeId;
    const result = await this.employeeOrderService.findOrdersByStore(storeId, filters);

    this.logger.log('Store orders request completed', 'StoreOrderController');
    return result;
  }

  /**
   * Найти заказ по коду получения
   * GET /api/v1/orders/employee/pickup-code/:pickupCode
   */
  @Get('pickup-code/:pickupCode')
  @HttpCode(HttpStatus.OK)
  @UseGuards(EmployeeJwtAuthGuard)
  @ApiOperation({
    summary: 'Find order by pickup code',
    description: 'Retrieve order details using pickup code for order completion'
  })
  @ApiResponse({
    status: 200,
    description: 'Order found successfully',
    type: OrderResponseDto
  })
  @ApiResponse({ status: 404, description: 'Order not found with this pickup code' })
  @ApiResponse({ status: 403, description: 'Order does not belong to your store' })
  async findOrderByPickupCode(
    @Req() req: RequestWithEmployee,
    @Param('pickupCode') pickupCode: string
  ): Promise<OrderResponseDto> {
    this.logger.log('Received request to find order by pickup code', 'StoreOrderController');

    const storeId: number = req.storeId;
    const result = await this.employeeOrderService.findOrderByPickupCode(pickupCode, storeId);

    this.logger.log('Find order by pickup code request completed', 'StoreOrderController');
    return result;
  }
}
