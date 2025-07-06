import {BadRequestException, Injectable, UnauthorizedException} from '@nestjs/common';
import {JwtService} from '@nestjs/jwt';
import {ConfigService} from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import {AuthRepository} from '../repositories/auth.repository';
import {LoginDto} from '../dto/login.dto';
import {AuthResponseDto} from '../dto/auth-response.dto';
import {RegisterEmployeeDto, RegisterEmployeeResponseDto} from '../dto/register-employee.dto';
import {EmployeeRole, StoreCredential} from '../entities/store-credential.entity';
import {ChangeCredentialsResponseDto, ChangeLoginDto, ChangePasswordDto} from '../dto/change-credentials.dto';
import { AppLogger } from '../../common/logger/app-logger.service';

@Injectable()
export class AuthService {
  private readonly MAX_LOGIN_ATTEMPTS = 5;
  private readonly LOCKOUT_TIME = 30 * 60 * 1000; // 30 минут

  constructor(
    private readonly authRepository: AuthRepository,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly logger: AppLogger,
  ) {}

  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    const { login, password } = loginDto;

    this.logger.debug(`Login attempt for user: ${login}`);

    // Найти учетные данные магазина
    const storeCredential = await this.authRepository.findByLogin(login);
    if (!storeCredential) {
      this.logger.warn(`Login failed: user not found - ${login}`);
      throw new UnauthorizedException('Неверные учетные данные');
    }

    // Проверить блокировку аккаунта
    if (this.isAccountLocked(storeCredential)) {
      this.logger.warn(`Login blocked: account locked - ${login}`, 'AuthService', {
        loginAttempts: storeCredential.loginAttempts,
        lastFailedLogin: storeCredential.lastFailedLogin,
      });
      throw new UnauthorizedException('Аккаунт заблокирован из-за превышения попыток входа');
    }

    // Проверить пароль
    const isPasswordValid = await bcrypt.compare(password, storeCredential.passwordHash);
    if (!isPasswordValid) {
      await this.authRepository.incrementLoginAttempts(storeCredential.id);
      this.logger.warn(`Login failed: invalid password - ${login}`, 'AuthService', {
        attempts: storeCredential.loginAttempts + 1,
        userId: storeCredential.id,
        storeId: storeCredential.store.id,
      });
      throw new UnauthorizedException('Неверные учетные данные');
    }

    // Успешная авторизация
    await this.authRepository.updateLastLogin(storeCredential.id);

    this.logger.logAuth('login_success', storeCredential.id, storeCredential.store.id);

    // Генерация токенов
    const payload = {
      sub: storeCredential.id,
      storeId: storeCredential.store.id,
      login: storeCredential.login,
      type: 'store_employee',
    };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: this.configService.get('JWT_ACCESS_EXPIRES_IN', '15m'),
    });

    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: this.configService.get('JWT_REFRESH_EXPIRES_IN', '7d'),
    });

    return {
      accessToken,
      refreshToken,
      storeId: storeCredential.store.id,
      login: storeCredential.login,
      expiresIn: 15 * 60, // 15 минут в секундах
    };
  }

  async refreshToken(refreshToken: string): Promise<AuthResponseDto> {
    try {
      this.logger.debug('Попытка обновления токена', 'AuthService');
      const payload = this.jwtService.verify(refreshToken);

      // Проверить, что токен еще действителен
      const storeCredential = await this.authRepository.findByLogin(payload.login);
      if (!storeCredential) {
        this.logger.warn(`Обновление токена отклонено: пользователь ${payload.login} не найден`, 'AuthService');
        throw new UnauthorizedException('Недействительный токен');
      }

      // Генерировать новые токены
      const newPayload = {
        sub: storeCredential.id,
        storeId: storeCredential.store.id,
        login: storeCredential.login,
        type: 'store_employee',
      };

      const newAccessToken = this.jwtService.sign(newPayload, {
        expiresIn: this.configService.get('JWT_ACCESS_EXPIRES_IN', '15m'),
      });

      const newRefreshToken = this.jwtService.sign(newPayload, {
        expiresIn: this.configService.get('JWT_REFRESH_EXPIRES_IN', '7d'),
      });

      this.logger.log('token_refreshed', 'AuthService', { credentialId: storeCredential.id, storeId: storeCredential.store.id} );

      return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        storeId: storeCredential.store.id,
        login: storeCredential.login,
        expiresIn: 15 * 60,
      };
    } catch (error) {
      this.logger.warn('Обновление токена не удалось', 'AuthService', { errorMessage: error.message });
      throw new UnauthorizedException('Недействительный refresh token');
    }
  }

  async validateToken(token: string): Promise<any> {
    try {
      this.logger.debug('Валидация токена', 'AuthService');
      const payload = this.jwtService.verify(token);
      this.logger.debug('Токен успешно валидирован', 'AuthService', { userId: payload.sub });
      return payload;
    } catch (error) {
      this.logger.warn('Токен не валиден', 'AuthService', { errorMessage: error.message });
      throw new UnauthorizedException('Недействительный токен');
    }
  }

  /**
   * Регистрация нового работника магазина
   */
  async registerEmployee(registerDto: RegisterEmployeeDto): Promise<RegisterEmployeeResponseDto> {
    const { storeId, login, password, role = EmployeeRole.STAFF } = registerDto;

    this.logger.log(`Employee registration attempt: ${login} for store ${storeId} with role ${role}`);

    // Проверить существование магазина
    const storeExists = await this.checkStoreExists(storeId);
    if (!storeExists) {
      throw new BadRequestException(`Магазин с ID ${storeId} не найден`);
    }

    // Проверить уникальность логина
    const loginExists = await this.authRepository.existsByLogin(login);
    if (loginExists) {
      throw new BadRequestException(`Логин "${login}" уже используется`);
    }

    // Проверить уникальность роли для магазина (согласно ограничению UNIQUE(store_id, employee_role))
    const roleExists = await this.authRepository.existsByStoreAndRole(storeId, role);
    if (roleExists) {
      throw new BadRequestException(`Роль "${role}" для магазина ID ${storeId} уже занята`);
    }

    // Хешировать пароль (используем тот же метод что и в login)
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Создать учетные данные
    const newCredentials = await this.authRepository.create({
      store: { id: storeId! } as any,
      login,
      passwordHash,
      employeeRole: role,
    });

    this.logger.logAuth('employee_registered', newCredentials.id, storeId, 'AuthService');
    this.logger.log(`Employee successfully registered: ${login}`, 'AuthService', {
      employeeId: newCredentials.id,
      storeId,
      role,
    });

    return {
      id: newCredentials.id,
      storeId: newCredentials.store.id,
      login: newCredentials.login,
      employeeRole: newCredentials.employeeRole,
      createdAt: newCredentials.createdAt,
    };
  }

  /**
   * Изменение логина работника магазина
   */
  async changeLogin(changeLoginDto: ChangeLoginDto): Promise<ChangeCredentialsResponseDto> {
    const { storeId, role = EmployeeRole.STAFF, newLogin } = changeLoginDto;

    this.logger.log(`Login change request for store ${storeId}, role ${role} to ${newLogin}`);

    // Найти существующие учетные данные
    const existingCredential = await this.authRepository.findByStoreAndRole(storeId, role);
    if (!existingCredential) {
      throw new BadRequestException(`Учетные данные для магазина ID ${storeId} с ролью "${role}" не найдены`);
    }

    // Проверить уникальность нового логина
    const loginExists = await this.authRepository.existsByLogin(newLogin);
    if (loginExists) {
      throw new BadRequestException(`Логин "${newLogin}" уже используется`);
    }

    // Обновить логин и получить UpdateResult
    await this.authRepository.updateLogin(storeId, role, newLogin);

    this.logger.log(`Login successfully changed for store ${storeId}, role ${role}`, 'AuthService', {
      storeId,
      role,
      newLogin,
    });

    return {
      success: true,
      message: `Логин успешно изменен на "${newLogin}"`,
      affectedRows: 1,
      storeId,
      employeeRole: role,
    };
  }

  /**
   * Изменение пароля работника магазина
   */
  async changePassword(changePasswordDto: ChangePasswordDto): Promise<ChangeCredentialsResponseDto> {
    const { storeId, role = EmployeeRole.STAFF, newPassword } = changePasswordDto;

    this.logger.log(`Password change request for store ${storeId}, role ${role}`);

    // Найти существующие учетные данные
    const existingCredential = await this.authRepository.findByStoreAndRole(storeId, role);
    if (!existingCredential) {
      throw new BadRequestException(`Учетные данные для магазина ID ${storeId} с ролью "${role}" не найдены`);
    }

    // Хешировать новый пароль (используем тот же метод что и в других местах)
    const saltRounds = 10;
    const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

    // Обновить пароль (не трогаем loginAttempts, так как это админская операция)
    await this.authRepository.updatePassword(storeId, role, newPasswordHash);

    this.logger.log(`Password successfully changed for store ${storeId}, role ${role}`, 'AuthService', {
      storeId,
      role,
    });

    return {
      success: true,
      message: 'Пароль успешно изменен',
      affectedRows: 1,
      storeId,
      employeeRole: role,
    };
  }

  /**
   * Проверка существования магазина
   */
  private async checkStoreExists(storeId: number): Promise<boolean> {
    // Простая проверка через попытку найти учетные данные с этим storeId
    // Альтернативно можно создать отдельный StoreRepository
    try {
      this.logger.debug(`Проверка существования магазина с ID: ${storeId}`, 'AuthService');
      const result = await this.authRepository.findByStoreId(storeId);
      this.logger.debug(`Магазин с ID: ${storeId} ${result.length > 0 ? 'существует' : 'не найден'}`, 'AuthService');
      return true; // Если запрос выполнился успешно, магазин существует
    } catch (error) {
      this.logger.error(`Ошибка при проверке существования магазина ${storeId}`, error.stack, 'AuthService');
      return false;
    }
  }

  private isAccountLocked(storeCredential: StoreCredential): boolean {
    if (storeCredential.loginAttempts < this.MAX_LOGIN_ATTEMPTS) {
      return false;
    }

    if (!storeCredential.lastFailedLogin) {
      return false;
    }

    const now = new Date();
    const lockoutEndTime = new Date(storeCredential.lastFailedLogin.getTime() + this.LOCKOUT_TIME);

    return now < lockoutEndTime;
  }
}
