import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../services/auth.service';
import { AppLogger } from '@common/logger/app-logger.service';
import { EmployeeJwtPayload } from '../interfaces/jwt-payload.interface';

@Injectable()
export class EmployeeJwtStrategy extends PassportStrategy(Strategy, 'employee-jwt') {
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
    this.logger.debug('Employee JWT Strategy initialized', 'EmployeeJwtStrategy');
  }

  async validate(payload: EmployeeJwtPayload) {
    this.logger.debug('Validating employee JWT token', 'EmployeeJwtStrategy', {
      credentialId: payload.sub,
      login: payload.login,
      type: payload.type,
    });

    if (!payload.sub || !payload.storeId || payload.type !== 'employee') {
      this.logger.warn('Invalid employee token format', 'EmployeeJwtStrategy', {
        hasSub: !!payload.sub,
        hasStoreId: !!payload.storeId,
        type: payload.type,
      });
      throw new UnauthorizedException('Недействительный токен сотрудника');
    }

    const validatedUser = {
      credentialId: payload.sub,
      storeId: payload.storeId,
      login: payload.login,
      type: payload.type,
    };

    this.logger.debug('Employee JWT token successfully validated', 'EmployeeJwtStrategy', {
      credentialId: validatedUser.credentialId,
      login: validatedUser.login,
    });

    return validatedUser;
  }
}
