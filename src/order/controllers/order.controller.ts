import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Body,
  Query,
  ParseIntPipe,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus, Request
} from '@nestjs/common';
import { OrderService } from '../services/order.service';
import { OrderResponseDto } from '../dto/order-response.dto';
import { ReserveBoxDto } from '../dto/reserve-box.dto';
import { CreateOrderDto } from '../dto/create-order.dto';
import { CancellerType } from '../entities/order.entity';
import { EmployeeJwtAuthGuard } from '@auth/guards/employee-jwt-auth.guard';
import { PaginatedResponseDto } from "@common/pagination/pagination.dto";
import { AppLogger } from '@common/logger/app-logger.service';
import {ApiBearerAuth, ApiOperation, ApiResponse, ApiTags} from "@nestjs/swagger";
import {CustomerJwtAuthGuard} from "@auth/guards/customer-jwt-auth.guard";
import {OrderFilterDto} from "@order/dto/order-filter.dto";
import {OrderOwnershipGuard} from "@order/guards/order-ownership.guard";

/**
 * Интерфейс для пользователя из JWT
 */
interface CustomerUser {
  id: number;
  email: string;
}

interface RequestWithUser extends Request {
  user: CustomerUser;
}

/**
 * Контроллер для управления заказами клиентами
 * следует REST принципам и единообразной структуре API
 */
@ApiTags('Customer Orders')
@ApiBearerAuth()
@Controller('api/v1/orders')
export class OrderController {
  constructor(
    private readonly orderService: OrderService,
    private readonly logger: AppLogger,
  ) {}

  /**
   * Резервирование бокса для заказа
   * POST /api/v1/orders/reserve
   */
  @Post('reserve')
  @HttpCode(HttpStatus.OK)
  @UseGuards(CustomerJwtAuthGuard)
  @ApiOperation({
    summary: 'Reserve a surprise box for order creation',
    description: 'Reserve a surprise box for a limited time to allow order creation'
  })
  @ApiResponse({ status: 200, description: 'Box reserved successfully' })
  @ApiResponse({ status: 404, description: 'Box not found' })
  @ApiResponse({ status: 409, description: 'Box not available for reservation' })
  async reserveBox(@Body() reserveBoxDto: ReserveBoxDto): Promise<{expiresAt: string | null}> {
    this.logger.log('Received request to reserve box', 'OrderController');

    const result = await this.orderService.reserveBox(reserveBoxDto);

    this.logger.log('Box reservation request completed', 'OrderController');
    return result;
  }


  /**
   * Создание нового заказа из зарезервированного бокса
   * POST /api/v1/orders
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(CustomerJwtAuthGuard)
  @ApiOperation({
    summary: 'Create new order from reserved box',
    description: 'Create a new order using a previously reserved surprise box'
  })
  @ApiResponse({ status: 201, description: 'Order created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid order data' })
  @ApiResponse({ status: 404, description: 'Customer or store not found' })
  @ApiResponse({ status: 409, description: 'Box reservation invalid or expired' })
  async createOrder(@Body() createOrderDto: CreateOrderDto): Promise<{ orderId: any, pickupCode: any }> {
    this.logger.log('Received request to create order', 'OrderController');

    const result = await this.orderService.createOrder(createOrderDto);

    this.logger.log('Order creation request completed', 'OrderController');
    return result;
  }

  /**
   * Получить заказы клиента
   * GET /api/v1/orders
   */
  @Get()
  @HttpCode(HttpStatus.OK)
  @UseGuards(CustomerJwtAuthGuard)
  @ApiOperation({
    summary: 'Get customer orders',
    description: 'Retrieve paginated list of completed, cancelled, refunded or active orders'
  })
  @ApiResponse({ status: 200, description: 'Orders retrieved successfully' })
  async getCustomerOrders(
    @Request() req: RequestWithUser,
    @Query() filters: OrderFilterDto
  ): Promise<PaginatedResponseDto<OrderResponseDto>> {
    this.logger.log('Received request to get order history', 'OrderController');

    const customerId = req.user.id;
    const result = await this.orderService.findOrdersByCustomer(customerId, filters);

    this.logger.log('Orders request completed', 'OrderController');
    return result;
  }


  /**
   * Получить заказ по ID
   * GET /api/v1/orders/:id
   */
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @UseGuards(CustomerJwtAuthGuard, OrderOwnershipGuard)
  @ApiOperation({
    summary: 'Get order by ID',
    description: 'Retrieve detailed information about a specific order'
  })
  @ApiResponse({ status: 200, description: 'Order retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async findOrderById(@Param('id', ParseIntPipe) id: number): Promise<OrderResponseDto> {
    this.logger.log('Received request to get order by ID', 'OrderController');

    const result = await this.orderService.findOrderById(id);

    this.logger.log('Get order by ID request completed', 'OrderController');
    return result;
  }

  /**
   * Отменить заказ (будущая функциональность)
   * PUT /api/v1/orders/:id/cancel
   */
  @Put(':id/cancel')
  @HttpCode(HttpStatus.OK)
  @UseGuards(CustomerJwtAuthGuard)
  @UseGuards(CustomerJwtAuthGuard, OrderOwnershipGuard)
  @ApiOperation({
    summary: 'Cancel order',
    description: 'Cancel an active order (feature coming soon)'
  })
  @ApiResponse({ status: 200, description: 'Order cancelled successfully' })
  @ApiResponse({ status: 400, description: 'Order cannot be cancelled' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  @ApiResponse({ status: 501, description: 'Feature not implemented yet' })
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
