import {Controller, Get, Query, ParseIntPipe, UseGuards, Param} from '@nestjs/common';
import { OrderService } from '../services/order.service';
import { OrderResponseDto } from '../dto/order-response.dto';
import { EmployeeJwtAuthGuard } from '@auth/guards/employee-jwt-auth-guard.service';
import { PaginatedResponseDto } from '@common/pagination/pagination.dto';
import { AppLogger } from '@common/logger/app-logger.service';

@Controller('orders/admin')
export class AdminOrderController {
  constructor(
    private readonly orderService: OrderService,
    private readonly logger: AppLogger,
  ) {}

  @Get('customer/:customerId')
  @UseGuards(EmployeeJwtAuthGuard)
  async findOrdersByCustomer(
    @Param('customerId', ParseIntPipe) customerId: number,
    @Query('page', ParseIntPipe) page=1,
    @Query('limit', ParseIntPipe) limit=20
  ): Promise<PaginatedResponseDto<OrderResponseDto>> {
    this.logger.log('Admin: Received request to find orders by customer', 'AdminOrderController');

    const result = await this.orderService.findOrdersByCustomer(customerId, page, limit);

    this.logger.log('Admin: Find orders by customer request completed', 'AdminOrderController');
    return result;
  }

  @Get('store/:storeId')
  @UseGuards(EmployeeJwtAuthGuard)
  async findOrdersByStoreId(
    @Param('storeId', ParseIntPipe) storeId: number,
    @Query('page', ParseIntPipe) page: number = 1,
    @Query('limit', ParseIntPipe) limit: number = 20
  ): Promise<PaginatedResponseDto<OrderResponseDto>> {
    this.logger.log('Admin: Received request to find orders by store', 'AdminOrderController');

    const result = await this.orderService.findOrdersByStore(storeId, page, limit);

    this.logger.log('Admin: Find orders by store request completed', 'AdminOrderController');
    return result;
  }
}