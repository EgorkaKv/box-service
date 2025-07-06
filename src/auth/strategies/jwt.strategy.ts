import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../services/auth.service';
import { AppLogger } from '../../common/logger/app-logger.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
    private readonly logger: AppLogger,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET', 'defaultSecret'),
    });
    logger.debug('JWT Strategy initialized', 'JwtStrategy');
  }

  async validate(payload: any) {
    this.logger.debug('Валидация JWT токена', 'JwtStrategy', {
      sub: payload.sub,
      login: payload.login,
    });

    if (!payload.sub || !payload.storeId) {
      this.logger.warn(
        'Неверный формат токена: отсутствуют обязательные поля',
        'JwtStrategy',
        {
          hasSub: !!payload.sub,
          hasStoreId: !!payload.storeId,
        },
      );
      throw new UnauthorizedException('Недействительный токен');
    }

    const validatedUser = {
      credentialId: payload.sub,
      storeId: payload.storeId,
      login: payload.login,
      type: payload.type,
    };

    this.logger.debug('JWT токен успешно валидирован', 'JwtStrategy', {
      credentialId: validatedUser.credentialId,
      login: validatedUser.login,
    });

    return validatedUser;
  }
}
