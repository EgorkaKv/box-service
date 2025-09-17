import { Body, Controller, HttpCode, HttpStatus, Post, Put, UseGuards, UsePipes, ValidationPipe, BadRequestException, UnauthorizedException, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiBearerAuth, ApiHeader } from '@nestjs/swagger';
import { AuthService } from '../services/auth.service';
import { LoginDto } from '../dto/login.dto';
import { RegisterEmployeeDto } from '../dto/register-employee.dto';
import { ChangeLoginDto, ChangePasswordDto } from '../dto/change-credentials.dto';
import { AdminPasswordGuard } from '../guards/admin-password.guard';
import { AppLogger } from '@common/logger/app-logger.service';

@ApiTags('Store Authentication')
@Controller('auth')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class StoreAuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly logger: AppLogger
  ) {}

  @ApiOperation({
    summary: 'Employee login',
    description: 'Authenticate store employee with credentials and return access tokens'
  })
  @ApiBody({
    type: LoginDto,
    description: 'Employee login credentials'
  })
  @ApiResponse({
    status: 200,
    description: 'Login successful',
    schema: {
      type: 'object',
      properties: {
        accessToken: { type: 'string', description: 'JWT access token' },
        refreshToken: { type: 'string', description: 'JWT refresh token' },
        tokenType: { type: 'string', description: 'Token type (Bearer)' }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed' })
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto):
    Promise<{accessToken: string; refreshToken: string; tokenType: string}> {
    this.logger.log('Received employee login request', 'AuthController');

    const result = await this.authService.login(loginDto);

    this.logger.log('Employee login request completed', 'AuthController');
    return result;
  }

  @ApiOperation({
    summary: 'Refresh access token',
    description: 'Generate new access token using valid refresh token'
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        refreshToken: { type: 'string', description: 'Valid refresh token' }
      },
      required: ['refreshToken']
    }
  })
  @ApiResponse({
    status: 200,
    description: 'Token refreshed successfully',
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
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refreshToken(@Body('refreshToken', new ValidationPipe()) refreshToken: string):
    Promise<{accessToken: string; refreshToken: string;}> {
    this.logger.log('Received token refresh request', 'AuthController');

    const result = await this.authService.refreshToken(refreshToken);

    this.logger.log('Token refresh request completed', 'AuthController');
    return result;
  }

  @ApiOperation({
    summary: 'Register new employee',
    description: 'Register a new store employee (admin access required)'
  })
  @ApiBody({
    type: RegisterEmployeeDto,
    description: 'Employee registration data'
  })
  @ApiHeader({
    name: 'x-admin-password',
    description: 'Admin password for authorization',
    required: true
  })
  @ApiResponse({ status: 201, description: 'Employee registered successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed' })
  @ApiResponse({ status: 403, description: 'Forbidden - invalid admin password' })
  @ApiResponse({ status: 409, description: 'Conflict - employee already exists' })
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(AdminPasswordGuard)
  async registerEmployee(@Body() registerDto: RegisterEmployeeDto): Promise<void> {
    this.logger.log('Received employee registration request', 'AuthController');

    await this.authService.registerEmployee(registerDto);

    this.logger.log('Employee registration request completed', 'AuthController');
  }

  @ApiOperation({
    summary: 'Change employee login',
    description: 'Change login credentials for an employee (admin access required)'
  })
  @ApiBody({
    type: ChangeLoginDto,
    description: 'New login credentials'
  })
  @ApiHeader({
    name: 'x-admin-password',
    description: 'Admin password for authorization',
    required: true
  })
  @ApiResponse({ status: 200, description: 'Login changed successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed' })
  @ApiResponse({ status: 403, description: 'Forbidden - invalid admin password' })
  @ApiResponse({ status: 404, description: 'Employee not found' })
  @Put('change-login')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AdminPasswordGuard)
  async changeLogin(@Body() changeLoginDto: ChangeLoginDto): Promise<void> {
    this.logger.log('Received login change request', 'AuthController');

    await this.authService.changeLogin(changeLoginDto);

    this.logger.log('Login change request completed', 'AuthController');
  }

  @ApiOperation({
    summary: 'Change employee password',
    description: 'Change password for an employee (admin access required)'
  })
  @ApiBody({
    type: ChangePasswordDto,
    description: 'New password data'
  })
  @ApiHeader({
    name: 'x-admin-password',
    description: 'Admin password for authorization',
    required: true
  })
  @ApiResponse({ status: 200, description: 'Password changed successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed' })
  @ApiResponse({ status: 403, description: 'Forbidden - invalid admin password' })
  @ApiResponse({ status: 404, description: 'Employee not found' })
  @Put('change-password')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AdminPasswordGuard)
  async changePassword(@Body() changePasswordDto: ChangePasswordDto): Promise<void> {
    this.logger.log('Received password change request', 'AuthController');

    await this.authService.changePassword(changePasswordDto);

    this.logger.log('Password change request completed', 'AuthController');
  }
}
