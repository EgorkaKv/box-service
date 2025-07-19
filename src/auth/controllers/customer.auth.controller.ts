import {Body, Controller, HttpCode, HttpStatus, Param, Post, UsePipes, ValidationPipe} from "@nestjs/common";
import {CustomerAuthService} from "@auth/services/customer-auth.service";
import {AppLogger} from "@common/logger/app-logger.service";
import {CustomerRefreshTokenDto, DecodeJwtDto, VerifyFirebaseTokenDto} from "@auth/dto/customer-auth.dto";

@Controller('auth')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class StoreAuthController {
  constructor(
    private readonly customerAuthService: CustomerAuthService,
    private readonly logger: AppLogger
  ) {}

  /**
   * Авторизация клиента через Firebase SMS
   */
  @Post('customer/verify-token')
  @HttpCode(HttpStatus.OK)
  async verifyFirebaseToken(@Body('idToken', new ValidationPipe()) idToken: string):
    Promise<{accessToken: string; refreshToken: string}> {
    this.logger.log('Received customer Firebase token verification request', 'AuthController');

    const result = await this.customerAuthService.verifyFirebaseToken(idToken);

    this.logger.log('Customer Firebase token verification completed', 'AuthController');
    return result;
  }

  /**
   * Обновление токена для клиента
   */
  @Post('customer/refresh')
  @HttpCode(HttpStatus.OK)
  async refreshCustomerToken(@Body('refreshToken', new ValidationPipe()) refreshToken: string):
    Promise<{accessToken: string; refreshToken: string}> {
    this.logger.log('Received customer token refresh request', 'AuthController');

    const result = await this.customerAuthService.refreshCustomerToken(refreshToken);

    this.logger.log('Customer token refresh completed', 'AuthController');
    return result;
  }

  /**
   * Тестовая авторизация клиента (для разработки)
   */
  @Post('customer/test/:customerId?')
  @HttpCode(HttpStatus.OK)
  async authTest(@Body() body: any, @Param('customerId') customerId?: string): Promise<{ token: string }> {
    this.logger.log('Received customer test auth request', 'AuthController');

    const result = await this.customerAuthService.authTest(customerId);

    this.logger.log('Customer test auth completed', 'AuthController');
    return result;
  }

  /**
   * Декодирование JWT токена
   */
  @Post('customer/decode')
  @HttpCode(HttpStatus.OK)
  async decodeJwtToken(@Body() decodeJwtDto: DecodeJwtDto): Promise<any> {
    this.logger.log('Received JWT decode request', 'AuthController');

    const result = await this.customerAuthService.decodeJwtToken(decodeJwtDto.token);

    this.logger.log('JWT decode request completed', 'AuthController');
    return result;
  }
}