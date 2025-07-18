import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AppLogger } from '@common/logger/app-logger.service';

@Injectable()
export class CustomerJwtAuthGuard extends AuthGuard('customer-jwt') {
  constructor(private readonly logger: AppLogger) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    const { method, url } = request;

    this.logger.debug(`Customer JWT Auth Guard: проверка доступа ${method} ${url}`, 'CustomerJwtAuthGuard');

    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    const { method, url } = request;

    if (err || !user) {
      const errorMessage = err?.message || 'Доступ запрещен для клиентов';
      this.logger.warn(`Customer JWT Auth Guard: доступ отклонен ${method} ${url}`, 'CustomerJwtAuthGuard', {
        errorType: err?.name || 'Unauthorized',
        errorMessage: errorMessage,
        hasUser: !!user,
      });
      throw new UnauthorizedException(errorMessage);
    }

    this.logger.debug(`Customer JWT Auth Guard: доступ разрешен ${method} ${url}`, 'CustomerJwtAuthGuard', {
      customerId: user.customerId,
    });

    return user;
  }
}
