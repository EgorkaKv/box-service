import {Injectable, UnauthorizedException, BadRequestException, NotFoundException} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { FirebaseConfig } from '@common/config/firebase.config';
import { CustomerRepository } from '@customer/repositories/customer.repository';
import { CustomerAuthResponseDto, DecodedTokenResponseDto } from '../dto/customer-auth.dto';
import { AppLogger } from '@common/logger/app-logger.service';
import { CustomerJwtPayload } from '../entities/jwt-payload.interface';
import {Customer} from "@customer/entities/customer.entity";

@Injectable()
export class CustomerAuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly customerRepository: CustomerRepository,
    private readonly configService: ConfigService,
    private readonly logger: AppLogger,
  ) {
    // Инициализируем Firebase при создании сервиса
    this.logger.warn('Firebase not initialized', 'CustomerAuthService');
    //FirebaseConfig.initialize(this.configService);
  }

  async verifyFirebaseToken(idToken: string):
    Promise<{accessToken: string; refreshToken: string}> {
    this.logger.log('Processing Firebase token verification', 'CustomerAuthService');

    // Получаем Firebase Admin SDK
    const admin = FirebaseConfig.getAdmin();

    // Проверяем Firebase токен
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const phoneNumber = decodedToken.phone_number;
    const email = decodedToken.email;

    if (!phoneNumber && !email) {
      this.logger.warn('Firebase token verification failed - no phone or email', 'CustomerAuthService');
      throw new BadRequestException('Invalid token: no phone number or email found');
    }

    // Ищем или создаем клиента
    let customer: Customer | null = null;
    if (phoneNumber) {
      customer = await this.customerRepository.findByPhone(phoneNumber);
      if (!customer) {
        customer = await this.customerRepository.createWithPhone(phoneNumber);
      }
    } else if (email) {
      customer = await this.customerRepository.findByEmail(email);
      if (!customer) {
        customer = await this.customerRepository.createWithEmail(email);
      }
    }
    if (!customer) {
      this.logger.debug('Firebase token verification failed - customer not found or created', 'CustomerAuthService');
      throw new BadRequestException('Customer not found');
    }

    // Создаем типизированный payload для customer
    const payload: CustomerJwtPayload = {
      sub: customer.id,
      type: 'customer',
      phone: customer.phone,
      email: customer.email,
    };

    // Генерируем JWT токены
    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRES_IN', '7d'),
    });

    this.logger.log('Customer Firebase authentication successful', 'CustomerAuthService', {customerId: customer.id});

    return {
      accessToken,
      refreshToken,
    };
  }

  async refreshCustomerToken(refreshToken: string): Promise<CustomerAuthResponseDto> {
    this.logger.log('Processing customer token refresh', 'CustomerAuthService');

    const payload = this.jwtService.verify(refreshToken) as CustomerJwtPayload;

    if (payload.type !== 'customer') {
      this.logger.debug('Customer token refresh failed - invalid token type', 'CustomerAuthService', {
        type: payload.type });
      throw new UnauthorizedException('Invalid token');
    }

    // Проверяем, что клиент существует
    const customer = await this.customerRepository.findById(payload.sub);
    if (!customer) {
      this.logger.debug('Customer token refresh failed - customer not found', 'CustomerAuthService', {
        customerId: payload.sub
      });
      throw new NotFoundException('Customer not found');
    }

    // Создаем новые токены
    const newPayload: CustomerJwtPayload = {
      sub: customer.id,
      type: 'customer',
      phone: customer.phone,
      email: customer.email,
    };

    const newAccessToken = this.jwtService.sign(newPayload);
    const newRefreshToken = this.jwtService.sign(newPayload, {
      expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRES_IN', '7d'),
    });

    this.logger.log('Customer token refresh successful', 'CustomerAuthService', {
      customerId: customer.id
    });

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken
    };
  }

  async authTest(customerId?: string): Promise<{ token: string }> {
    this.logger.log('Processing test authentication', 'CustomerAuthService', { customerId });

    const payload: CustomerJwtPayload = {
      sub: customerId ? parseInt(customerId) : 1,
      type: 'customer',
    };

    const token = this.jwtService.sign(payload, { expiresIn: '1h' });

    this.logger.log('Test authentication completed', 'CustomerAuthService');

    return { token };
  }

  async decodeJwtToken(token: string): Promise<DecodedTokenResponseDto> {
    this.logger.log('Processing JWT token decoding', 'CustomerAuthService');

    try {
      const decoded = this.jwtService.verify(token) as CustomerJwtPayload;

      this.logger.log('JWT token decoded successfully', 'CustomerAuthService', {
        customerId: decoded.sub,
        type: decoded.type
      });

      return { decoded: decoded.sub.toString() };

    } catch (error: any) {
      this.logger.error('JWT token decoding failed', 'CustomerAuthService', error.stack, {
        error: error.message
      });

      throw new UnauthorizedException(`Failed to decode token: ${error.message}`);
    }
  }
}
