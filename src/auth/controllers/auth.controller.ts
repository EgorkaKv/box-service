import { Controller, Post, Put, Body, HttpCode, HttpStatus, UsePipes, ValidationPipe, UseGuards } from '@nestjs/common';
import { AuthService } from '../services/auth.service';
import { LoginDto } from '../dto/login.dto';
import { AuthResponseDto, RefreshTokenDto } from '../dto/auth-response.dto';
import { RegisterEmployeeDto, RegisterEmployeeResponseDto } from '../dto/register-employee.dto';
import { ChangeLoginDto, ChangePasswordDto, ChangeCredentialsResponseDto } from '../dto/change-credentials.dto';
import { AdminPasswordGuard } from '../guards/admin-password.guard';

@Controller('auth')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto): Promise<AuthResponseDto> {
    return this.authService.login(loginDto);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refreshToken(@Body() refreshTokenDto: RefreshTokenDto): Promise<AuthResponseDto> {
    return this.authService.refreshToken(refreshTokenDto.refreshToken);
  }

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(AdminPasswordGuard)
  async registerEmployee(@Body() registerDto: RegisterEmployeeDto): Promise<RegisterEmployeeResponseDto> {
    return this.authService.registerEmployee(registerDto);
  }

  @Put('change-login')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AdminPasswordGuard)
  async changeLogin(@Body() changeLoginDto: ChangeLoginDto): Promise<ChangeCredentialsResponseDto> {
    return this.authService.changeLogin(changeLoginDto);
  }

  @Put('change-password')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AdminPasswordGuard)
  async changePassword(@Body() changePasswordDto: ChangePasswordDto): Promise<ChangeCredentialsResponseDto> {
    return this.authService.changePassword(changePasswordDto);
  }
}
