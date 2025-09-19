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
import {ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, ApiParam, ApiQuery, ApiBody} from "@nestjs/swagger";
import {CustomerJwtAuthGuard} from "@auth/guards/customer-jwt-auth.guard";
import {OrderFilterDto} from "@order/dto/order-filter.dto";
import {OrderOwnershipGuard} from "@order/guards/order-ownership.guard";

/**
 * Интерфейс для пользователя из JWT
 */
interface CustomerUser {
  customerId: number;
  email?: string;
  type: 'customer';
  phone?: string;
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
    description: 'Reserve a surprise box for a limited time to allow order creation. Reservation expires after specified time.'
  })
  @ApiBody({
    type: ReserveBoxDto,
    description: 'Box reservation details'
  })
  @ApiResponse({
    status: 200,
    description: 'Box reserved successfully',
    schema: {
      type: 'object',
      properties: {
        expiresAt: { type: 'string', format: 'date-time', example: '2023-12-01T10:05:00Z' }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing authentication token' })
  @ApiResponse({ status: 404, description: 'Box not found' })
  @ApiResponse({ status: 409, description: 'Box not available for reservation' })
  async reserveBox(@Body() reserveBoxDto: ReserveBoxDto, @Req() req: RequestWithUser): Promise<{expiresAt: string | null}> {
    this.logger.log('Received request to reserve box', 'OrderController');
    // Привязываем резервирование к аутентифицированному клиенту
    const user = req.user;
    console.log('CONTROLLER:', user);
    const customerId = user.customerId;
    console.log('CONTROLLER reserveBox customerId=', customerId)

    const result = await this.orderService.reserveBox(reserveBoxDto, customerId);

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
  @ApiBody({
    type: CreateOrderDto,
    description: 'Order creation details'
  })
  @ApiResponse({
    status: 201,
    description: 'Order created successfully',
    schema: {
      type: 'object',
      properties: {
        orderId: { type: 'number', example: 123 },
        pickupCode: { type: 'string', example: 'ABC123' }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Invalid order data' })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing authentication token' })
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
    description: 'Retrieve paginated list of completed, cancelled, refunded or active orders for authenticated customer'
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
  async getCustomerOrders(
    @Request() req: RequestWithUser,
    @Query() filters: OrderFilterDto
  ): Promise<PaginatedResponseDto<OrderResponseDto>> {
    this.logger.log('Received request to get order history', 'OrderController');

    const customerId = req.user.customerId;
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
    description: 'Retrieve detailed information about a specific order. Customer can only access their own orders.'
  })
  @ApiParam({
    name: 'id',
    description: 'Order ID',
    type: Number,
    example: 123
  })
  @ApiResponse({
    status: 200,
    description: 'Order retrieved successfully',
    type: OrderResponseDto
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing authentication token' })
  @ApiResponse({ status: 403, description: 'Forbidden - not authorized to access this order' })
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
  @UseGuards(CustomerJwtAuthGuard, OrderOwnershipGuard)
  @ApiOperation({
    summary: 'Cancel order',
    description: 'Cancel an active order (feature coming soon)'
  })
  @ApiParam({
    name: 'id',
    description: 'Order ID to cancel',
    type: Number,
    example: 123
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        cancelledBy: {
          enum: ['CUSTOMER', 'STORE', 'ADMIN'],
          example: 'CUSTOMER',
          description: 'Who is cancelling the order'
        }
      },
      required: ['cancelledBy']
    }
  })
  @ApiResponse({ status: 200, description: 'Order cancelled successfully' })
  @ApiResponse({ status: 400, description: 'Order cannot be cancelled' })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing authentication token' })
  @ApiResponse({ status: 403, description: 'Forbidden - not authorized to cancel this order' })
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
