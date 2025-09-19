import {Controller, Get, Query, ParseIntPipe, UseGuards, Param} from '@nestjs/common';
import { OrderService } from '../services/order.service';
import { OrderResponseDto } from '../dto/order-response.dto';
import { EmployeeJwtAuthGuard } from '@auth/guards/employee-jwt-auth.guard';
import { PaginatedResponseDto } from '@common/pagination/pagination.dto';
import { AppLogger } from '@common/logger/app-logger.service';
import {EmployeeOrderService} from "@order/services/employee-order.service";
import {OrderFilterDto} from "@order/dto/order-filter.dto";
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';

@ApiTags('Admin Orders')
@ApiBearerAuth()
@Controller('orders/admin')
export class AdminOrderController {
  constructor(
    private readonly orderService: OrderService,
    private readonly employeeOrderService: EmployeeOrderService,
    private readonly logger: AppLogger,
  ) {}

  @Get('customer/:customerId')
  @UseGuards(EmployeeJwtAuthGuard)
  @ApiOperation({
    summary: 'Get orders by customer ID (Admin)',
    description: 'Retrieve all orders for a specific customer. Admin access required.'
  })
  @ApiParam({
    name: 'customerId',
    description: 'The ID of the customer whose orders to retrieve',
    type: Number,
    example: 123
  })
  @ApiQuery({
    name: 'page',
    description: 'Page number for pagination',
    required: false,
    type: Number,
    example: 1
  })
  @ApiQuery({
    name: 'limit',
    description: 'Number of items per page',
    required: false,
    type: Number,
    example: 10
  })
  @ApiQuery({
    name: 'status',
    description: 'Filter by order status',
    required: false,
    enum: ['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'REFUNDED']
  })
  @ApiQuery({
    name: 'orderDateFrom',
    description: 'Filter orders from this date',
    required: false,
    type: String,
    format: 'date-time'
  })
  @ApiQuery({
    name: 'orderDateTo',
    description: 'Filter orders until this date',
    required: false,
    type: String,
    format: 'date-time'
  })
  @ApiResponse({
    status: 200,
    description: 'Orders retrieved successfully',
    type: PaginatedResponseDto<OrderResponseDto>
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing authentication token' })
  @ApiResponse({ status: 403, description: 'Forbidden - admin access required' })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  async findOrdersByCustomer(
    @Param('customerId', ParseIntPipe) customerId: number,
    @Query() filters: OrderFilterDto
  ): Promise<PaginatedResponseDto<OrderResponseDto>> {
    this.logger.log('Admin: Received request to find orders by customer', 'AdminOrderController');

    const result = await this.orderService.findOrdersByCustomer(customerId, filters);

    this.logger.log('Admin: Find orders by customer request completed', 'AdminOrderController');
    return result;
  }

  @Get('store/:storeId')
  @UseGuards(EmployeeJwtAuthGuard)
  @ApiOperation({
    summary: 'Get orders by store ID (Admin)',
    description: 'Retrieve all orders for a specific store. Admin access required.'
  })
  @ApiParam({
    name: 'storeId',
    description: 'The ID of the store whose orders to retrieve',
    type: Number,
    example: 5
  })
  @ApiQuery({
    name: 'page',
    description: 'Page number for pagination',
    required: false,
    type: Number,
    example: 1
  })
  @ApiQuery({
    name: 'limit',
    description: 'Number of items per page',
    required: false,
    type: Number,
    example: 10
  })
  @ApiQuery({
    name: 'status',
    description: 'Filter by order status',
    required: false,
    enum: ['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'REFUNDED']
  })
  @ApiQuery({
    name: 'orderDateFrom',
    description: 'Filter orders from this date',
    required: false,
    type: String,
    format: 'date-time'
  })
  @ApiQuery({
    name: 'orderDateTo',
    description: 'Filter orders until this date',
    required: false,
    type: String,
    format: 'date-time'
  })
  @ApiResponse({
    status: 200,
    description: 'Store orders retrieved successfully',
    type: PaginatedResponseDto<OrderResponseDto>
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing authentication token' })
  @ApiResponse({ status: 403, description: 'Forbidden - admin access required' })
  @ApiResponse({ status: 404, description: 'Store not found' })
  async findOrdersByStoreId(
    @Param('storeId', ParseIntPipe) storeId: number,
    @Query() filters: OrderFilterDto
  ): Promise<PaginatedResponseDto<OrderResponseDto>> {
    this.logger.log('Admin: Received request to find orders by store', 'AdminOrderController');

    const result = await this.employeeOrderService.findOrdersByStore(storeId, filters);

    this.logger.log('Admin: Find orders by store request completed', 'AdminOrderController');
    return result;
  }
}