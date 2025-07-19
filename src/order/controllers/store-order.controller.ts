import {Controller, Post, Body, UseGuards, Req, Query, Get, ParseIntPipe, Param} from '@nestjs/common';
import { OrderService } from '../services/order.service';
import { CompleteOrderDto } from '../dto/complete-order.dto';
import { EmployeeJwtAuthGuard } from '@auth/guards/employee-jwt-auth.guard';
import { AppLogger } from '@common/logger/app-logger.service';
import {PaginatedResponseDto} from "@common/pagination/pagination.dto";
import {OrderResponseDto} from "@order/dto/order-response.dto";

@Controller('orders/employee')
export class StoreOrderController {
  constructor(
    private readonly orderService: OrderService,
    private readonly logger: AppLogger,
  ) {}

  /**
   * Завершение заказа магазином
   */
  @Post('complete')
  @UseGuards(EmployeeJwtAuthGuard)
  async completeOrder(@Req() req: any, @Body() completeOrderDto: CompleteOrderDto): Promise<void> {
    this.logger.log('Received request to complete order', 'StoreOrderController');

    const storeId = req.storeId;
    await this.orderService.completeOrder(
      completeOrderDto.orderId,
      completeOrderDto.pickupCode,
      storeId
    );

    this.logger.log('Complete order request completed', 'StoreOrderController');
    return
  }


  // FIXME: не понятно что возвращает этот роут, нужно уточнить
  @Get('store')
  @UseGuards(EmployeeJwtAuthGuard)
  async getStoreOrders(
    @Req() req: any,
    @Query('page', ParseIntPipe) page=1,
    @Query('limit', ParseIntPipe) limit=20
  ): Promise<PaginatedResponseDto<OrderResponseDto>> {
    this.logger.log('Received request to get store orders', 'StoreOrderController');

    const storeId = req.user.storeId;
    const result = await this.orderService.findOrdersByStore(storeId, page, limit);

    this.logger.log('Store orders request completed', 'StoreOrderController');
    return result;
  }

  @Get('pickup-code/:pickupCode')
  @UseGuards(EmployeeJwtAuthGuard)
  async findOrderByPickupCode( @Req() req: any, @Param('pickupCode') pickupCode: string):
    Promise<OrderResponseDto> {

    this.logger.log('Received request to find order by pickup code', 'StoreOrderController');

    const storeId: number = req.storeId
    const result = await this.orderService.findOrderByPickupCode(pickupCode, storeId);

    this.logger.log('Find order by pickup code request completed', 'StoreOrderController');
    return result;
  }
}
