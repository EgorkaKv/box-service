import { Controller, Get, Post, Put, Param, Body, Query, ParseIntPipe, UseGuards, Req } from '@nestjs/common';
import { OrderService } from '../services/order.service';
import { OrderResponseDto } from '../dto/order-response.dto';
import { ReserveBoxDto } from '../dto/reserve-box.dto';
import { CreateOrderDto } from '../dto/create-order.dto';
import { CancellerType } from '../entities/order.entity';
import { EmployeeJwtAuthGuard } from '@auth/guards/employee-jwt-auth.guard';
import { PaginatedResponseDto } from "@common/pagination/pagination.dto";
import { AppLogger } from '@common/logger/app-logger.service';

@Controller('orders')
export class OrderController {
  constructor(
    private readonly orderService: OrderService,
    private readonly logger: AppLogger,
  ) {}

  /**
    * Резервирование бокса для заказа
   */
  @Post('reserve')
  @UseGuards(EmployeeJwtAuthGuard)
  async reserveBox(@Body() reserveBoxDto: ReserveBoxDto): Promise<{expiresAt: string | null}> {
    this.logger.log('Received request to reserve box', 'OrderController');

    const result = await this.orderService.reserveBox(reserveBoxDto);

    this.logger.log('Box reservation request completed', 'OrderController');
    return result;
  }


  /**
   * создание нового заказа из зарезервированного бокса
   */
  @Post()
  @UseGuards(EmployeeJwtAuthGuard)
  async createOrder(@Body() createOrderDto: CreateOrderDto): Promise<{ orderId: any, pickupCode: any }> {
    this.logger.log('Received request to create order', 'OrderController');

    const result = await this.orderService.createOrder(createOrderDto);

    this.logger.log('Order creation request completed', 'OrderController');
    return result;
  }


  @Get('active')
  @UseGuards(EmployeeJwtAuthGuard)
  async getActiveOrders( @Req() req: any, @Query('page', ParseIntPipe) page=1, @Query('limit', ParseIntPipe) limit=20
  ): Promise<PaginatedResponseDto<OrderResponseDto>> {

    this.logger.log('Received request to get active orders', 'OrderController');

    const customerId = req.user.id;
    const result = await this.orderService.getActiveOrdersByCustomer(customerId, page, limit);

    this.logger.log('Active orders request completed', 'OrderController');
    return result;
  }


  @Get('history')
  @UseGuards(EmployeeJwtAuthGuard)
  async getOrderHistory(
    @Req() req: any,
    @Query('page', ParseIntPipe) page: number = 1,
    @Query('limit', ParseIntPipe) limit: number = 20
  ): Promise<PaginatedResponseDto<OrderResponseDto>> {
    this.logger.log('Received request to get order history', 'OrderController');

    const customerId = req.user.id;
    const result = await this.orderService.getOrderHistoryByCustomer(customerId, page, limit);

    this.logger.log('Order history request completed', 'OrderController');
    return result;
  }


  @Get(':id')
  @UseGuards(EmployeeJwtAuthGuard)
  async findOrderById(@Param('id', ParseIntPipe) id: number): Promise<OrderResponseDto> {
    this.logger.log('Received request to get order by ID', 'OrderController');

    const result = await this.orderService.findOrderById(id);

    this.logger.log('Get order by ID request completed', 'OrderController');
    return result;
  }

  @Put(':id/cancel')
  @UseGuards(EmployeeJwtAuthGuard)
  async cancelOrderManual(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { cancelledBy: CancellerType },
  ): Promise<void> {
    this.logger.log('Received request to cancel order', 'OrderController');

    await this.orderService.cancelOrder();

    this.logger.log('Cancel order request completed', 'OrderController');
    return
  }
}
