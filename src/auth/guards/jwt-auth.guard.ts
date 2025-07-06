import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Observable } from 'rxjs';
import { AppLogger } from '../../common/logger/app-logger.service';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly logger: AppLogger) {
    super();
  }

  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();
    const { method, url } = request;

    this.logger.debug(`JWT Auth Guard: проверка доступа ${method} ${url}`, 'JwtAuthGuard');

    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    const { method, url } = request;

    // Если есть ошибка или пользователь не определен
    if (err || !user) {
      const errorMessage = err?.message || 'Доступ запрещен';
      this.logger.warn(`JWT Auth Guard: доступ отклонен ${method} ${url}`, 'JwtAuthGuard', {
        errorType: err?.name || 'Unauthorized',
        errorMessage: errorMessage,
        hasUser: !!user
      });
      throw err || new UnauthorizedException(errorMessage);
    }

    // Если авторизация успешна
    this.logger.debug(`JWT Auth Guard: доступ разрешен ${method} ${url}`, 'JwtAuthGuard', {
      userId: user.credentialId,
      storeId: user.storeId,
      login: user.login
    });

    return user;
  }
}
