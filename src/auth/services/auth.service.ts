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

@Injectable()
export class AuthService {
  private readonly MAX_LOGIN_ATTEMPTS = 5;
  private readonly LOCKOUT_TIME = 30 * 60 * 1000; // 30 минут

  constructor(
    private readonly authRepository: AuthRepository,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    const { login, password } = loginDto;

    // Найти учетные данные магазина
    const storeCredential = await this.authRepository.findByLogin(login);
    if (!storeCredential) {
      throw new UnauthorizedException('Неверные учетные данные');
    }

    // Проверить блокировку аккаунта
    if (this.isAccountLocked(storeCredential)) {
      throw new UnauthorizedException('Аккаунт заблокирован из-за превышения попыток входа');
    }

    // Проверить пароль
    const isPasswordValid = await bcrypt.compare(password, storeCredential.passwordHash);
    if (!isPasswordValid) {
      await this.authRepository.incrementLoginAttempts(storeCredential.id);
      throw new UnauthorizedException('Неверные учетные данные');
    }

    // Успешная авторизация
    await this.authRepository.updateLastLogin(storeCredential.id);

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
      const payload = this.jwtService.verify(refreshToken);

      // Проверить, что токен еще действителен
      const storeCredential = await this.authRepository.findByLogin(payload.login);
      if (!storeCredential) {
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

      return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        storeId: storeCredential.store.id,
        login: storeCredential.login,
        expiresIn: 15 * 60,
      };
    } catch (error) {
      throw new UnauthorizedException('Недействительный refresh token');
    }
  }

  async validateToken(token: string): Promise<any> {
    try {
      return this.jwtService.verify(token);
    } catch (error) {
      throw new UnauthorizedException('Недействительный токен');
    }
  }

  /**
   * Регистрация нового работника магазина
   */
  async registerEmployee(registerDto: RegisterEmployeeDto): Promise<RegisterEmployeeResponseDto> {
    const { storeId, login, password, role = EmployeeRole.STAFF } = registerDto;

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
      store: { id: storeId! } as any, // Приводим к типу any, чтобы TypeScript не ругался
      login,
      passwordHash,
      employeeRole: role,
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
      const result = await this.authRepository.findByStoreId(storeId);
      return true; // Если запрос выполнился успешно, магазин существует
    } catch (error) {
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
