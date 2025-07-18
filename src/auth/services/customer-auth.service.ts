import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { FirebaseConfig } from '@common/config/firebase.config';
import { CustomerRepository } from '@customer/repositories/customer.repository';
import { VerifyFirebaseTokenDto, CustomerAuthResponseDto, DecodedTokenResponseDto } from '../dto/customer-auth.dto';
import { AppLogger } from '@common/logger/app-logger.service';
import { CustomerJwtPayload } from '../interfaces/jwt-payload.interface';

@Injectable()
export class CustomerAuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly customerRepository: CustomerRepository,
    private readonly configService: ConfigService,
    private readonly logger: AppLogger,
  ) {
    // Инициализируем Firebase при создании сервиса
    FirebaseConfig.initialize(this.configService);
  }

  /**
   * Авторизация через Firebase SMS
   */
  async verifyFirebaseToken(verifyTokenDto: VerifyFirebaseTokenDto): Promise<CustomerAuthResponseDto> {
    this.logger.log('Starting Firebase token verification', 'CustomerAuthService');

    try {
      // Получаем Firebase Admin SDK
      const admin = FirebaseConfig.getAdmin();

      // Проверяем Firebase токен
      const decodedToken = await admin.auth().verifyIdToken(verifyTokenDto.idToken);
      const phoneNumber = decodedToken.phone_number;
      const email = decodedToken.email;

      if (!phoneNumber && !email) {
        throw new BadRequestException('Invalid token: no phone number or email found');
      }

      // Ищем или создаем клиента
      let customer;
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

      this.logger.log('Customer successfully authenticated', 'CustomerAuthService', {
        customerId: customer.id,
        phone: customer.phone,
      });

      return {
        accessToken,
        refreshToken,
        customer: {
          id: customer.id,
          phone: customer.phone,
          email: customer.email,
        },
      };
    } catch (error) {
      this.logger.error(`Firebase token verification failed: ${error.message}`, 'CustomerAuthService');
      throw new UnauthorizedException('Invalid Firebase token');
    }
  }

  /**
   * Обновление токена для клиента
   */
  async refreshCustomerToken(refreshToken: string): Promise<CustomerAuthResponseDto> {
    this.logger.log('Starting customer token refresh', 'CustomerAuthService');

    try {
      const payload = this.jwtService.verify(refreshToken) as CustomerJwtPayload;

      if (payload.type !== 'customer') {
        throw new UnauthorizedException('Invalid token type');
      }

      // Проверяем, что клиент существует
      const customer = await this.customerRepository.findById(payload.sub);
      if (!customer) {
        throw new UnauthorizedException('Customer not found');
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

    } catch (error: any) {
      this.logger.error(`Customer token refresh failed: ${error.message}`, 'CustomerAuthService');

      throw new UnauthorizedException(`Failed to refresh token: ${error.message}`);
    }
  }

  /**
   * Тестовая авторизация для разработки
   */
  async authTest(customerId?: string): Promise<{ token: string }> {
    this.logger.log('Test authentication requested', 'CustomerAuthService', { customerId });

    const payload: CustomerJwtPayload = {
      sub: customerId ? parseInt(customerId) : 1,
      type: 'customer',
      phone: undefined,
      email: undefined,
    };

    const token = this.jwtService.sign(payload, { expiresIn: '1h' });

    return { token };
  }

  /**
   * Декодирование JWT токена
   */
  async decodeJwtToken(token: string): Promise<DecodedTokenResponseDto> {
    this.logger.log('JWT token decoding requested', 'CustomerAuthService');

    try {
      const decoded = this.jwtService.verify(token) as CustomerJwtPayload;

      this.logger.log('JWT token decoded successfully', 'CustomerAuthService', {
        customerId: decoded.sub,
        type: decoded.type
      });

      return { decoded: decoded.sub.toString() };

    } catch (error: any) {
      this.logger.error(`JWT token decoding failed: ${error.message}`, 'CustomerAuthService' );

      throw new UnauthorizedException(`Failed to decode token: ${error.message}`);
    }
  }
}
