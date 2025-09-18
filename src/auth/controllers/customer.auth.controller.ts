import {Body, Controller, HttpCode, HttpStatus, Param, Post, UsePipes, ValidationPipe} from "@nestjs/common";
import {ApiTags, ApiOperation, ApiResponse, ApiBody, ApiParam} from '@nestjs/swagger';
import {CustomerAuthService} from "@auth/services/customer-auth.service";
import {AppLogger} from "@common/logger/app-logger.service";
import {CustomerAuthResponseDto, CustomerLoginDto} from "@auth/dto/customer-auth.dto";
import {CustomerRegisterDto} from "@auth/dto/customer-register.dto";

@ApiTags('Customer Authentication')
@Controller('auth/customer')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class CustomerAuthController {
  constructor(
    private readonly customerAuthService: CustomerAuthService,
    private readonly logger: AppLogger
  ) {}

  /**
   * Авторизация клиента через Firebase SMS
   */
  @ApiOperation({
    summary: 'Verify Firebase token',
    description: 'Authenticate customer using Firebase SMS token and return access tokens'
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        idToken: { type: 'string', description: 'Firebase ID token from SMS verification' }
      },
      required: ['idToken']
    }
  })
  @ApiResponse({
    status: 200,
    description: 'Firebase token verified successfully',
    schema: {
      type: 'object',
      properties: {
        accessToken: { type: 'string', description: 'JWT access token' },
        refreshToken: { type: 'string', description: 'JWT refresh token' }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Invalid Firebase token' })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed' })
  @Post('/firebase')
  @HttpCode(HttpStatus.OK)
  async verifyFirebaseToken(@Body('idToken', new ValidationPipe()) idToken: string):
    Promise<{accessToken: string; refreshToken: string}> {
    this.logger.log('Received customer Firebase token verification request', 'AuthController');

    const result = await this.customerAuthService.verifyFirebaseToken(idToken);

    this.logger.log('Customer Firebase token verification completed', 'AuthController');
    return result;
  }

  /**
   * Авторизация клиента по логину и паролю
   */
  @ApiOperation({
    summary: 'Customer login with password',
    description: 'Authenticate customer using login (email or phone) and password'
  })
  @ApiBody({
    type: CustomerLoginDto,
    description: 'Customer login credentials'
  })
  @ApiResponse({
    status: 200,
    description: 'Customer authenticated successfully',
    schema: {
      type: 'object',
      properties: {
        accessToken: { type: 'string', description: 'JWT access token' },
        refreshToken: { type: 'string', description: 'JWT refresh token' },
        customer: {
          type: 'object',
          properties: {
            id: { type: 'number', description: 'Customer ID' },
            phone: { type: 'string', description: 'Customer phone number' },
            email: { type: 'string', description: 'Customer email' }
          }
        }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed' })
  @Post('/login')
  @HttpCode(HttpStatus.OK)
  async loginWithPassword(@Body() loginDto: CustomerLoginDto):
    Promise<{accessToken: string; refreshToken: string; customer?: any}> {
    this.logger.log('Received customer login request', 'AuthController');

    const result = await this.customerAuthService.loginCustomer(loginDto);

    this.logger.log('Customer login completed', 'AuthController');
    return result;
  }

  /**
   * Обновление токена для клиента
   */
  @ApiOperation({
    summary: 'Refresh customer token',
    description: 'Generate new access token for customer using valid refresh token'
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        grant_type: { 
          type: 'string', 
          description: 'Must be "refresh_token"',
          example: 'refresh_token'
        },
        refresh_token: { 
          type: 'string', 
          description: 'Valid customer refresh token' 
        }
      },
      required: ['grant_type', 'refresh_token']
    },
    description: 'Form data (application/x-www-form-urlencoded)'
  })
  @ApiResponse({
    status: 200,
    description: 'Customer token refreshed successfully',
    schema: {
      type: 'object',
      properties: {
        accessToken: { type: 'string', description: 'New JWT access token' },
        refreshToken: { type: 'string', description: 'New JWT refresh token' }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Invalid refresh token' })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed' })
  @Post('/refresh')
  @HttpCode(HttpStatus.OK)
  async refreshCustomerToken(@Body('refreshToken', new ValidationPipe()) refreshToken: string):
    Promise<{accessToken: string; refreshToken: string}> {
    this.logger.log('Received customer token refresh request', 'AuthController');

    const result = await this.customerAuthService.refreshCustomerToken(refreshToken);

    this.logger.log('Customer token refresh completed', 'AuthController');
    return result;
  }

  /**
   * Регистрация нового клиента
   * @param customerRegisterDto
   */
  @ApiOperation({
    summary: 'Register new customer',
    description: 'Create a new customer account with phone, email, and password'
  })
  @ApiBody({
    type: CustomerRegisterDto,
    description: 'Customer registration data'
  })
  @ApiResponse({
    status: 201,
    description: 'Customer registered successfully',
    schema: {
      type: 'object',
      properties: {
        accessToken: { type: 'string', description: 'JWT access token' },
        refreshToken: { type: 'string', description: 'JWT refresh token' },
        customer: {
          type: 'object',
          properties: {
            id: { type: 'number', description: 'Customer ID' },
            phone: { type: 'string', description: 'Customer phone number' },
            email: { type: 'string', description: 'Customer email' }
          }
        }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed or email/phone already in use' })
  @Post('/register')
  @HttpCode(HttpStatus.CREATED)
  async registerCustomer(@Body() customerRegisterDto: CustomerRegisterDto): Promise<CustomerAuthResponseDto> {
    this.logger.log('Received customer registration request', 'AuthController');

    const result = await this.customerAuthService.registerCustomer(customerRegisterDto);

    this.logger.log('Customer registration completed', 'AuthController');
    return result;
  }

/*  /!**
   * Тестовая авторизация клиента (для разработки)
   *!/
  @ApiOperation({
    summary: 'Test customer authentication',
    description: 'Development endpoint for testing customer authentication without Firebase'
  })
  @ApiParam({
    name: 'customerId',
    description: 'Customer ID for test authentication (optional)',
    required: false,
    type: 'string'
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {},
      description: 'Request body (can be empty for test purposes)'
    }
  })
  @ApiResponse({
    status: 200,
    description: 'Test authentication successful',
    schema: {
      type: 'object',
      properties: {
        token: { type: 'string', description: 'Test JWT token' }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post('/test/:customerId')
  @HttpCode(HttpStatus.OK)
  async authTest(@Body() body: any, @Param('customerId') customerId?: string): Promise<{ token: string }> {
    this.logger.log('Received customer test auth request', 'AuthController');

    const result = await this.customerAuthService.authTest(customerId);

    this.logger.log('Customer test auth completed', 'AuthController');
    return result;
  }*/

/*  /!**
   * Декодирование JWT токена
   *!/
  @ApiOperation({
    summary: 'Decode JWT token',
    description: 'Decode and return the payload of a JWT token for debugging purposes'
  })
  @ApiBody({
    type: DecodeJwtDto,
    description: 'JWT token to decode'
  })
  @ApiResponse({
    status: 200,
    description: 'Token decoded successfully',
    schema: {
      type: 'object',
      description: 'Decoded JWT payload'
    }
  })
  @ApiResponse({ status: 400, description: 'Invalid token format' })
  @ApiResponse({ status: 401, description: 'Token verification failed' })
  @Post('customer/decode')
  @HttpCode(HttpStatus.OK)
  async decodeJwtToken(@Body() decodeJwtDto: DecodeJwtDto): Promise<any> {
    this.logger.log('Received JWT decode request', 'AuthController');

    const result = await this.customerAuthService.decodeJwtToken(decodeJwtDto.token);

    this.logger.log('JWT decode request completed', 'AuthController');
    return result;
  }*/
}