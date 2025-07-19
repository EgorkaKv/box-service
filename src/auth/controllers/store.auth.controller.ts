import { Body, Controller, HttpCode, HttpStatus, Post, Put, UseGuards, UsePipes, ValidationPipe, BadRequestException, UnauthorizedException, Param } from '@nestjs/common';
import { AuthService } from '../services/auth.service';
import { LoginDto } from '../dto/login.dto';
import { RegisterEmployeeDto } from '../dto/register-employee.dto';
import { ChangeLoginDto, ChangePasswordDto } from '../dto/change-credentials.dto';
import { AdminPasswordGuard } from '../guards/admin-password.guard';
import { AppLogger } from '@common/logger/app-logger.service';

@Controller('auth')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class StoreAuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly logger: AppLogger
  ) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto):
    Promise<{accessToken: string; refreshToken: string; tokenType: string}> {
    this.logger.log('Received employee login request', 'AuthController');

    const result = await this.authService.login(loginDto);

    this.logger.log('Employee login request completed', 'AuthController');
    return result;
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refreshToken(@Body('refreshToken', new ValidationPipe()) refreshToken: string):
    Promise<{accessToken: string; refreshToken: string;}> {
    this.logger.log('Received token refresh request', 'AuthController');

    const result = await this.authService.refreshToken(refreshToken);

    this.logger.log('Token refresh request completed', 'AuthController');
    return result;
  }

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(AdminPasswordGuard)
  async registerEmployee(@Body() registerDto: RegisterEmployeeDto): Promise<void> {
    this.logger.log('Received employee registration request', 'AuthController');

    await this.authService.registerEmployee(registerDto);

    this.logger.log('Employee registration request completed', 'AuthController');
  }

  @Put('change-login')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AdminPasswordGuard)
  async changeLogin(@Body() changeLoginDto: ChangeLoginDto): Promise<void> {
    this.logger.log('Received login change request', 'AuthController');

    await this.authService.changeLogin(changeLoginDto);

    this.logger.log('Login change request completed', 'AuthController');
  }

  @Put('change-password')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AdminPasswordGuard)
  async changePassword(@Body() changePasswordDto: ChangePasswordDto): Promise<void> {
    this.logger.log('Received password change request', 'AuthController');

    await this.authService.changePassword(changePasswordDto);

    this.logger.log('Password change request completed', 'AuthController');
  }
}
