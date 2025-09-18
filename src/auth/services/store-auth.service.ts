import {ConflictException, HttpException, Injectable, NotFoundException, UnauthorizedException} from '@nestjs/common';
import {JwtService} from '@nestjs/jwt';
import {ConfigService} from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import {StoreCredentialRepository} from '../repositories/store-credential.repository';
import {EmployeeLoginDto} from '../dto/employee-login.dto';
import {RegisterEmployeeDto} from '../dto/register-employee.dto';
import {EmployeeRole, StoreCredential} from '../entities/store-credential.entity';
import {ChangeLoginDto, ChangePasswordDto} from '../dto/change-credentials.dto';
import {AppLogger} from '@common/logger/app-logger.service';
import {EmployeeJwtPayload} from '../entities/jwt-payload.interface';
import {Store} from "@store/entities/store.entity";

@Injectable()
export class StoreAuthService {
  private readonly MAX_LOGIN_ATTEMPTS = 5;
  private readonly LOCKOUT_TIME = 30 * 60 * 1000; // 30 минут
  private readonly SALT_ROUNDS = 10;

  constructor(
    private readonly storeCredentialRepository: StoreCredentialRepository,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly logger: AppLogger,
  ) {}

  async loginEmployee(loginDto: EmployeeLoginDto):
    Promise<{accessToken: string; refreshToken: string; tokenType: string}> {

    this.logger.log('Processing employee login request', 'AuthService', {login: loginDto.login});

    // Найти учетные данные
    const storeCredential = await this.storeCredentialRepository.findByLogin(loginDto.login);
    if (!storeCredential) {
      this.logger.debug('Login failed - credentials not found', 'AuthService', { login: loginDto.login });
      throw new UnauthorizedException('invalid login or password');
    }

    // Проверить блокировку аккаунта
    if (this.isAccountLocked(storeCredential)) {
      this.logger.debug('Login failed - account locked', 'AuthService', {
        login: loginDto.login, attempts: storeCredential.loginAttempts });
      // выкидываем ошибку, что привышено количество попыток входа
      throw new HttpException('Account is locked due to too many failed login attempts', 429);
    }

      // Проверить пароль
      const isPasswordValid = await bcrypt.compare(loginDto.password, storeCredential.passwordHash);
      if (!isPasswordValid) {
        await this.storeCredentialRepository.incrementLoginAttempts(storeCredential.id);
        this.logger.debug('Login failed - invalid password', 'AuthService', {
          login: loginDto.login, attempts: storeCredential.loginAttempts + 1});
        throw new UnauthorizedException('invalid login or password');
      }

      // Сбросить счетчик попыток входа
      await this.storeCredentialRepository.setSuccessLogin(storeCredential.id);

      // Создать токены
      const { accessToken, refreshToken } = this.generateTokens(storeCredential);

      this.logger.log('Employee login successful', 'AuthService', {
        credentialId: storeCredential.id, storeId: storeCredential.store.id });

      return {
        accessToken,
        refreshToken,
        tokenType: 'Bearer',
      };
    }

  async refreshToken(refreshToken: string): Promise<{accessToken: string; refreshToken: string;}> {
    this.logger.log('Processing token refresh request', 'AuthService');

    const payload = this.jwtService.verify(refreshToken) as EmployeeJwtPayload;

    if (!payload.type) {
      this.logger.debug('Token refresh failed - invalid token type', 'AuthService', {payload: payload});
      throw new UnauthorizedException('invalid refresh token');
    }

    // Проверить существование учетных данных
    const storeCredential = await this.storeCredentialRepository.findById(payload.sub);
    if (!storeCredential) {
      this.logger.debug('Token refresh failed - credentials not found', 'AuthService', {credentialId: payload.sub});
      throw new UnauthorizedException('invalid refresh token');
    }

    // Создать новые токены
    const { accessToken: newAccessToken, refreshToken: newRefreshToken } = this.generateTokens(storeCredential);

    this.logger.log('Token refresh successful', 'AuthService', {
      credentialId: storeCredential.id
    });

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  }

  async registerEmployee(registerDto: RegisterEmployeeDto): Promise<void> {
    this.logger.log('Processing employee registration', 'AuthService', {
      login: registerDto.login, storeId: registerDto.storeId, role: registerDto.role });

    // check that login is not already exists
    const loginIsRegistered = await this.storeCredentialRepository.findByLogin(registerDto.login);
    if (loginIsRegistered) {
      this.logger.debug('Employee registration failed - login already exists', 'AuthService',
        {login: registerDto})
      throw new ConflictException('Login already exists');
    }

    // check that store exists
    const storeExists = await this.storeCredentialRepository.findByStoreId(registerDto.storeId);
    if (!storeExists) {
      this.logger.debug('Employee registration failed - store not found', 'AuthService',
        {storeId: registerDto.storeId});
      throw new NotFoundException('Store not found');
    }

    // check that role is not already occupied
    const roleIsOccupied = await this.storeCredentialRepository.findByStoreAndRole(
      registerDto.storeId, registerDto.role );
    if (roleIsOccupied) {
      this.logger.debug('Employee registration failed - role already occupied', 'AuthService',
        {storeId: registerDto.storeId, role: registerDto.role});
      throw new ConflictException('Role is already occupied in this store');
    }


    // Хешировать пароль
    const passwordHash = await bcrypt.hash(registerDto.password, this.SALT_ROUNDS);

    // Создать учетные данные
    const newCredentials = await this.storeCredentialRepository.create({
      store: {id: registerDto.storeId} as Store,
      login: registerDto.login,
      passwordHash,
      employeeRole: registerDto.role || EmployeeRole.STAFF,
    });

    this.logger.log('Employee registration successful', 'AuthService', {
      credentialId: newCredentials.id,
      login: registerDto.login
    });
  }

  async changeLogin(changeLoginDto: ChangeLoginDto): Promise<void> {
    this.logger.log('Processing login change request', 'AuthService', {
      storeId: changeLoginDto.storeId,
      role: changeLoginDto.role,
      newLogin: changeLoginDto.newLogin
    });

    // Проверить существование учетных данных
    const existingCredential = await this.storeCredentialRepository.findByStoreAndRole(
      changeLoginDto.storeId,
      changeLoginDto.role
    );

    if (!existingCredential) {
      this.logger.debug('Login change failed - credentials not found', 'AuthService', {
        storeId: changeLoginDto.storeId, role: changeLoginDto.role});
      throw new NotFoundException('Not found credentials for this store and role');
    }

    // Проверить уникальность нового логина
    const loginExists = await this.storeCredentialRepository.findByLogin(changeLoginDto.newLogin);
    if (loginExists) {
      this.logger.debug('Login change failed - login already exists', 'AuthService', {newLogin: changeLoginDto.newLogin});
      throw new ConflictException('Login already exists');
    }

    // Обновить логин
    const updateResult = await this.storeCredentialRepository.updateLogin(
      changeLoginDto.storeId,
      changeLoginDto.role,
      changeLoginDto.newLogin
    );
    if (!updateResult.affected || updateResult.affected < 1) {
      this.logger.debug('Login change failed - no rows affected', 'AuthService', {
        storeId: changeLoginDto.storeId, newLogin: changeLoginDto.newLogin
      });
      throw new HttpException('Failed to change login', 500);
    }

    this.logger.log('Login change successful', 'AuthService', {
      storeId: changeLoginDto.storeId,
      newLogin: changeLoginDto.newLogin
    });
  }

  async changePassword(changePasswordDto: ChangePasswordDto): Promise<void> {
    this.logger.log('Processing password change request', 'AuthService', {
      storeId: changePasswordDto.storeId, role: changePasswordDto.role});

    // Проверить существование учетных данных
    const existingCredential = await this.storeCredentialRepository.findByStoreAndRole(
      changePasswordDto.storeId,
      changePasswordDto.role || EmployeeRole.STAFF
    );

    if (!existingCredential) {
      this.logger.debug('Password change failed - credentials not found', 'AuthService', {
        storeId: changePasswordDto.storeId, role: changePasswordDto.role
      });
      throw new NotFoundException('Not found credentials for this store and role');
    }

    // Хешировать новый пароль
    const newPasswordHash = await bcrypt.hash(changePasswordDto.newPassword, this.SALT_ROUNDS);

    // Обновить пароль
    const updateResult = await this.storeCredentialRepository.updatePassword(
      changePasswordDto.storeId,
      changePasswordDto.role || EmployeeRole.STAFF,
      newPasswordHash
    );

    if (!updateResult.affected || updateResult.affected < 1) {
      this.logger.debug('Password change failed - no rows affected', 'AuthService', {
        storeId: changePasswordDto.storeId, role: changePasswordDto.role
      });
      throw new HttpException('Failed to change password', 500);
    }

    this.logger.log('Password change successful', 'AuthService', {
      storeId: changePasswordDto.storeId
    });
  }

  private generateTokens(credential: StoreCredential): { accessToken: string; refreshToken: string } {
    const payload: EmployeeJwtPayload = {
      sub: credential.id,
      storeId: credential.store.id,
      login: credential.login,
      type: EmployeeRole.STAFF,
    };

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRES_IN', '7d'),
    });

    return { accessToken, refreshToken };
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
