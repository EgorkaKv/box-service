import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StoreAuthController } from './controllers/store.auth.controller';
import { CustomerAuthController } from './controllers/customer.auth.controller';
import { StoreAuthService } from './services/store-auth.service';
import { CustomerAuthService } from './services/customer-auth.service';
import { StoreCredentialRepository } from './repositories/store-credential.repository';
import { EmployeeJwtStrategy } from './strategies/employee-jwt.strategy';
import { CustomerJwtStrategy } from './strategies/customer-jwt.strategy';
import { AdminJwtStrategy } from './strategies/admin-jwt.strategy';
import { StoreCredential } from './entities/store-credential.entity';
import { CustomerModule } from '@customer/customer.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([StoreCredential]),
    PassportModule.register({ defaultStrategy: 'employee-jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET', 'defaultSecretKey'),
        signOptions: {
          expiresIn: configService.get<string>('JWT_ACCESS_EXPIRES_IN', '15m'),
        },
      }),
    }),
    CustomerModule, // Добавляем CustomerModule для доступа к CustomerRepository
  ],
  controllers: [
    StoreAuthController,
    CustomerAuthController,
  ],
  providers: [
    StoreAuthService,
    CustomerAuthService,
    StoreCredentialRepository,
    EmployeeJwtStrategy,
    CustomerJwtStrategy,
    AdminJwtStrategy
  ],
  exports: [
    StoreAuthService,
    CustomerAuthService,
    EmployeeJwtStrategy,
    CustomerJwtStrategy,
    AdminJwtStrategy,
    PassportModule
  ],
})
export class AuthModule {}
