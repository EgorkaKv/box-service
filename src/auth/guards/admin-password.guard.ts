import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AdminPasswordGuard implements CanActivate {
  private readonly ADMIN_PASSWORD = 'admin1'; // Захардкоженный пароль

  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const adminPassword = request.headers['x-admin-password'];

    if (!adminPassword) {
      throw new UnauthorizedException('Отсутствует пароль администратора');
    }

    if (adminPassword !== this.ADMIN_PASSWORD) {
      throw new UnauthorizedException('Неверный пароль администратора');
    }

    return true;
  }
}
