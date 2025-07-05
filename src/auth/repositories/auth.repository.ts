import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {Repository, UpdateResult} from 'typeorm';
import { StoreCredential, EmployeeRole } from '../entities/store-credential.entity';

@Injectable()
export class AuthRepository {
  constructor(
    @InjectRepository(StoreCredential)
    private readonly storeCredentialRepository: Repository<StoreCredential>,
  ) {}

  /**
   * Поиск учетных данных по логину
   */
  async findByLogin(login: string): Promise<StoreCredential | null> {
    return this.storeCredentialRepository.findOne({
      where: { login },
      relations: ['store'],
    });
  }

  /**
   * Поиск учетных данных по ID
   */
  async findById(id: number): Promise<StoreCredential | null> {
    return this.storeCredentialRepository.findOne({
      where: { id },
      relations: ['store'],
    });
  }

  /**
   * Обновление времени последнего входа и сброс попыток входа
   */
  async updateLastLogin(id: number): Promise<void> {
    await this.storeCredentialRepository.update(id, {
      lastLogin: new Date(),
      loginAttempts: 0,
      lastFailedLogin: undefined,
    });
  }

  /**
   * Увеличение количества неудачных попыток входа
   */
  async incrementLoginAttempts(id: number): Promise<void> {
    await this.storeCredentialRepository
      .createQueryBuilder()
      .update(StoreCredential)
      .set({
        loginAttempts: () => 'login_attempts + 1',
        lastFailedLogin: new Date(),
      })
      .where('id = :id', { id })
      .execute();
  }

  /**
   * Сброс попыток входа
   */
  async resetLoginAttempts(id: number): Promise<void> {
    await this.storeCredentialRepository.update(id, {
      loginAttempts: 0,
      lastFailedLogin: undefined,
    });
  }

  /**
   * Получение всех учетных данных для конкретного магазина
   */
  async findByStoreId(storeId: number): Promise<StoreCredential[]> {
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
    return await this.storeCredentialRepository.update(
      { store: {id: storeId}, employeeRole },
      { login: newLogin }
    );
  }

  /**
   * Обновление пароля для конкретного магазина и роли
   */
  async updatePassword(storeId: number, employeeRole: EmployeeRole, newPasswordHash: string): Promise<UpdateResult> {
    return await this.storeCredentialRepository.update(
      { store: {id: storeId}, employeeRole },
      { passwordHash: newPasswordHash }
    );
  }

  /**
   * Создание новых учетных данных
   */
  async create(credentialData: Partial<StoreCredential>): Promise<StoreCredential> {
    const credential = this.storeCredentialRepository.create(credentialData);
    return this.storeCredentialRepository.save(credential);
  }

  /**
   * Обновление учетных данных
   */
  async update(id: number, updateData: Omit<Partial<StoreCredential>, 'id' | 'store' | 'createdAt' | 'updatedAt'>): Promise<void> {
    await this.storeCredentialRepository.update(id, updateData);
  }

  /**
   * Удаление учетных данных
   */
  async delete(id: number): Promise<void> {
    await this.storeCredentialRepository.delete(id);
  }

  /**
   * Проверка существования логина
   */
  async existsByLogin(login: string): Promise<boolean> {
    const count = await this.storeCredentialRepository.count({
      where: { login },
    });
    return count > 0;
  }

  /**
   * Проверка существования роли для магазина
   */
  async existsByStoreAndRole(storeId: number, employeeRole: EmployeeRole): Promise<boolean> {
    const count = await this.storeCredentialRepository.count({
      where: {
        store: { id: storeId },
        employeeRole
      },
    });
    return count > 0;
  }

  /**
   * Получение заблокированных аккаунтов
   */
  async findLockedAccounts(maxAttempts: number = 5): Promise<StoreCredential[]> {
    return this.storeCredentialRepository
      .createQueryBuilder('credential')
      .where('credential.login_attempts >= :maxAttempts', { maxAttempts })
      .andWhere('credential.last_failed_login IS NOT NULL')
      .getMany();
  }
}
