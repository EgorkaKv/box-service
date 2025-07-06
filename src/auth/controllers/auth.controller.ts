import {Body, Controller, HttpCode, HttpStatus, Post, Put, UseGuards, UsePipes, ValidationPipe} from '@nestjs/common';
import {AuthService} from '../services/auth.service';
import {LoginDto} from '../dto/login.dto';
import {AuthResponseDto, RefreshTokenDto} from '../dto/auth-response.dto';
import {RegisterEmployeeDto, RegisterEmployeeResponseDto} from '../dto/register-employee.dto';
import {ChangeCredentialsResponseDto, ChangeLoginDto, ChangePasswordDto} from '../dto/change-credentials.dto';
import {AdminPasswordGuard} from '../guards/admin-password.guard';
import {AppLogger} from '../../common/logger/app-logger.service';

@Controller('auth')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly logger: AppLogger
  ) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto): Promise<AuthResponseDto> {
    this.logger.log(`Начата авторизация для логина: ${loginDto.login}`, 'AuthController');
    return await this.authService.login(loginDto);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refreshToken(@Body() refreshTokenDto: RefreshTokenDto): Promise<AuthResponseDto> {
    this.logger.log('Запрос на обновление токена', 'AuthController');
    return await this.authService.refreshToken(refreshTokenDto.refreshToken);
  }

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(AdminPasswordGuard)
  async registerEmployee(@Body() registerDto: RegisterEmployeeDto): Promise<RegisterEmployeeResponseDto> {
    this.logger.log(`Запрос на регистрацию сотрудника с логином: ${registerDto.login} для магазина: ${registerDto.storeId}`, 'AuthController');
    return await this.authService.registerEmployee(registerDto);
  }

  @Put('change-login')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AdminPasswordGuard)
  async changeLogin(@Body() changeLoginDto: ChangeLoginDto): Promise<ChangeCredentialsResponseDto> {
    this.logger.log(`Запрос на изменение логина для магазина: ${changeLoginDto.storeId}, роль: ${changeLoginDto.role}`, 'AuthController');
    return await this.authService.changeLogin(changeLoginDto);
  }

  @Put('change-password')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AdminPasswordGuard)
  async changePassword(@Body() changePasswordDto: ChangePasswordDto): Promise<ChangeCredentialsResponseDto> {
    this.logger.log(`Запрос на изменение пароля для магазина: ${changePasswordDto.storeId}, роль: ${changePasswordDto.role}`, 'AuthController');
    return await this.authService.changePassword(changePasswordDto);
  }
}
