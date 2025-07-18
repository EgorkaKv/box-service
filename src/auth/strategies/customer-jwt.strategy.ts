// filepath: src/auth/strategies/customer-jwt.strategy.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { AppLogger } from '@common/logger/app-logger.service';
import { CustomerJwtPayload } from '../interfaces/jwt-payload.interface';

@Injectable()
export class CustomerJwtStrategy extends PassportStrategy(Strategy, 'customer-jwt') {
  constructor(
    private readonly configService: ConfigService,
    private readonly logger: AppLogger,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET', 'defaultSecret'),
    });
    this.logger.debug('Customer JWT Strategy initialized', 'CustomerJwtStrategy');
  }

  async validate(payload: CustomerJwtPayload) {
    this.logger.debug('Validating customer JWT token', 'CustomerJwtStrategy', {
      customerId: payload.sub,
      type: payload.type,
    });

    if (!payload.sub || payload.type !== 'customer') {
      this.logger.warn('Invalid customer token format', 'CustomerJwtStrategy', {
        hasSub: !!payload.sub,
        type: payload.type,
      });
      throw new UnauthorizedException('Недействительный токен клиента');
    }

    const validatedUser = {
      customerId: payload.sub,
      type: payload.type,
      phone: payload.phone,
      email: payload.email,
    };

    this.logger.debug('Customer JWT token successfully validated', 'CustomerJwtStrategy', {
      customerId: validatedUser.customerId,
    });

    return validatedUser;
  }
}
