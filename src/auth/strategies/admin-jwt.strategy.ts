// filepath: src/auth/strategies/admin-jwt.strategy.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { AppLogger } from '@common/logger/app-logger.service';
import { AdminJwtPayload } from '../entities/jwt-payload.interface';

@Injectable()
export class AdminJwtStrategy extends PassportStrategy(Strategy, 'admin-jwt') {
  constructor(
    private readonly configService: ConfigService,
    private readonly logger: AppLogger,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET', 'defaultSecret'),
    });
    this.logger.debug('Admin JWT Strategy initialized', 'AdminJwtStrategy');
  }

  async validate(payload: AdminJwtPayload) {
    this.logger.debug('Validating admin JWT token', 'AdminJwtStrategy', {
      adminId: payload.sub,
      login: payload.login,
      type: payload.type,
    });

    if (!payload.sub || !payload.login || payload.type !== 'admin') {
      this.logger.warn('Invalid admin token format', 'AdminJwtStrategy', {
        hasSub: !!payload.sub,
        hasLogin: !!payload.login,
        type: payload.type,
      });
      throw new UnauthorizedException('Недействительный токен администратора');
    }

    const validatedUser = {
      adminId: payload.sub,
      login: payload.login,
      type: payload.type,
    };

    this.logger.debug('Admin JWT token successfully validated', 'AdminJwtStrategy', {
      adminId: validatedUser.adminId,
      login: validatedUser.login,
    });

    return validatedUser;
  }
}
