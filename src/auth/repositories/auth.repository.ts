import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {Repository, UpdateResult} from 'typeorm';
import { StoreCredential, EmployeeRole } from '../entities/store-credential.entity';
import { AppLogger } from '../../common/logger/app-logger.service';

@Injectable()
export class AuthRepository {
  constructor(
    @InjectRepository(StoreCredential)
    private readonly storeCredentialRepository: Repository<StoreCredential>,
    private readonly logger: AppLogger,
  ) {}

  /**
   * Поиск учетных данных по логину
   */
  async findByLogin(login: string): Promise<StoreCredential | null> {
    this.logger.logDatabase('query', 'StoreCredential', undefined, 'AuthRepository', {
      operation: 'findByLogin',
      login
    });
    return this.storeCredentialRepository.findOne({
      where: { login },
      relations: ['store'],
    });
  }

  /**
   * Поиск учетных данных по ID
   */
  async findById(id: number): Promise<StoreCredential | null> {
    this.logger.logDatabase('query', 'StoreCredential', undefined, 'AuthRepository', {
      operation: 'findById',
      id
    });
    return this.storeCredentialRepository.findOne({
      where: { id },
      relations: ['store'],
    });
  }

  /**
   * Обновление времени последнего входа и сброс попыток входа
   */
  async updateLastLogin(id: number): Promise<void> {
    const startTime = Date.now();
    await this.storeCredentialRepository.update(id, {
      lastLogin: new Date(),
      loginAttempts: 0,
      lastFailedLogin: undefined,
    });
    const duration = Date.now() - startTime;
    this.logger.logDatabase('update', 'StoreCredential', duration, 'AuthRepository', {
      operation: 'updateLastLogin',
      id
    });
  }

  /**
   * Увеличение количества неудачных попыток входа
   */
  async incrementLoginAttempts(id: number): Promise<void> {
    const startTime = Date.now();
    await this.storeCredentialRepository
      .createQueryBuilder()
      .update(StoreCredential)
      .set({
        loginAttempts: () => 'login_attempts + 1',
        lastFailedLogin: new Date(),
      })
      .where('id = :id', { id })
      .execute();
    const duration = Date.now() - startTime;
    this.logger.logDatabase('update', 'StoreCredential', duration, 'AuthRepository', {
      operation: 'incrementLoginAttempts',
      id
    });
  }

  /**
   * Сброс попыток входа
   */
  async resetLoginAttempts(id: number): Promise<void> {
    const startTime = Date.now();
    await this.storeCredentialRepository.update(id, {
      loginAttempts: 0,
      lastFailedLogin: undefined,
    });
    const duration = Date.now() - startTime;
    this.logger.logDatabase('update', 'StoreCredential', duration, 'AuthRepository', {
      operation: 'resetLoginAttempts',
      id
    });
  }

  /**
   * Получение всех учетных данных для конкретного магазина
   */
  async findByStoreId(storeId: number): Promise<StoreCredential[]> {
    this.logger.logDatabase('query', 'StoreCredential', undefined, 'AuthRepository', {
      operation: 'findByStoreId',
      storeId
    });
    return this.storeCredentialRepository.find({
      where: { store: { id: storeId } },
      relations: ['store'],
      order: {
        createdAt: 'DESC',
      },
    });
  }

  /**
   * Поиск учетных данных по ID магазина и роли
   */
  async findByStoreAndRole(storeId: number, employeeRole: EmployeeRole): Promise<StoreCredential | null> {
    this.logger.logDatabase('query', 'StoreCredential', undefined, 'AuthRepository', {
      operation: 'findByStoreAndRole',
      storeId,
      employeeRole
    });
    return this.storeCredentialRepository.findOne({
      where: {
        store: { id: storeId },
        employeeRole
      },
      relations: ['store'],
    });
  }

  /**
   * Обновление логина для конкретного магазина и роли
   */
  async updateLogin(storeId: number, employeeRole: EmployeeRole, newLogin: string): Promise<UpdateResult> {
    const startTime = Date.now();
    const result = await this.storeCredentialRepository.update(
      { store: {id: storeId}, employeeRole },
      { login: newLogin }
    );
    const duration = Date.now() - startTime;
    this.logger.logDatabase('update', 'StoreCredential', duration, 'AuthRepository', {
      operation: 'updateLogin',
      storeId,
      employeeRole,
      newLogin,
      affected: result.affected
    });
    return result;
  }

  /**
   * Обновление пароля для конкретного магазина и роли
   */
  async updatePassword(storeId: number, employeeRole: EmployeeRole, newPasswordHash: string): Promise<UpdateResult> {
    const startTime = Date.now();
    const result = await this.storeCredentialRepository.update(
      { store: {id: storeId}, employeeRole },
      { passwordHash: newPasswordHash }
    );
    const duration = Date.now() - startTime;
    this.logger.logDatabase('update', 'StoreCredential', duration, 'AuthRepository', {
      operation: 'updatePassword',
      storeId,
      employeeRole,
      affected: result.affected
    });
    return result;
  }

  /**
   * Создание новых учетных данных
   */
  async create(credentialData: Partial<StoreCredential>): Promise<StoreCredential> {
    const startTime = Date.now();
    const credential = this.storeCredentialRepository.create(credentialData);
    const result = await this.storeCredentialRepository.save(credential);
    const duration = Date.now() - startTime;
    this.logger.logDatabase('create', 'StoreCredential', duration, 'AuthRepository', {
      operation: 'create',
      storeId: credentialData.store?.id,
      employeeRole: credentialData.employeeRole,
      resultId: result.id
    });
    return result;
  }

  /**
   * Обновление учетных данных
   */
  async update(id: number, updateData: Omit<Partial<StoreCredential>, 'id' | 'store' | 'createdAt' | 'updatedAt'>): Promise<void> {
    const startTime = Date.now();
    await this.storeCredentialRepository.update(id, updateData);
    const duration = Date.now() - startTime;
    this.logger.logDatabase('update', 'StoreCredential', duration, 'AuthRepository', {
      operation: 'update',
      id
    });
  }

  /**
   * Удаление учетных данных
   */
  async delete(id: number): Promise<void> {
    const startTime = Date.now();
    await this.storeCredentialRepository.delete(id);
    const duration = Date.now() - startTime;
    this.logger.logDatabase('delete', 'StoreCredential', duration, 'AuthRepository', {
      operation: 'delete',
      id
    });
  }

  /**
   * Проверка существования логина
   */
  async existsByLogin(login: string): Promise<boolean> {
    const startTime = Date.now();
    const count = await this.storeCredentialRepository.count({
      where: { login },
    });
    const duration = Date.now() - startTime;
    this.logger.logDatabase('query', 'StoreCredential', duration, 'AuthRepository', {
      operation: 'existsByLogin',
      login,
      exists: count > 0
    });
    return count > 0;
  }

  /**
   * Проверка существования роли для магазина
   */
  async existsByStoreAndRole(storeId: number, employeeRole: EmployeeRole): Promise<boolean> {
    const startTime = Date.now();
    const count = await this.storeCredentialRepository.count({
      where: {
        store: { id: storeId },
        employeeRole
      },
    });
    const duration = Date.now() - startTime;
    this.logger.logDatabase('query', 'StoreCredential', duration, 'AuthRepository', {
      operation: 'existsByStoreAndRole',
      storeId,
      employeeRole,
      exists: count > 0
    });
    return count > 0;
  }

  /**
   * Получение заблокированных аккаунтов
   */
  async findLockedAccounts(maxAttempts: number = 5): Promise<StoreCredential[]> {
    this.logger.logDatabase('query', 'StoreCredential', undefined, 'AuthRepository', {
      operation: 'findLockedAccounts',
      maxAttempts
    });
    return this.storeCredentialRepository
      .createQueryBuilder('credential')
      .where('credential.login_attempts >= :maxAttempts', { maxAttempts })
      .andWhere('credential.last_failed_login IS NOT NULL')
      .getMany();
  }
}
