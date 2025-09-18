import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, UpdateResult } from 'typeorm';
import { StoreCredential, EmployeeRole } from '../entities/store-credential.entity';
import { AppLogger } from '@common/logger/app-logger.service';

@Injectable()
export class StoreCredentialRepository {
  constructor(
    @InjectRepository(StoreCredential)
     private readonly storeCredentialRepository: Repository<StoreCredential>,
    private readonly logger: AppLogger,
  ) {}

  /**
   * Поиск учетных данных по логину
   */
  async findByLogin(login: string): Promise<StoreCredential | null> {
    this.logger.debug('Finding credentials by login', 'AuthRepository', { login });

    const credential = await this.storeCredentialRepository.findOne({
      where: { login },
      relations: ['store'],
    });

    this.logger.debug('Credentials search completed', 'AuthRepository', {
      login,
      found: !!credential,
      credentialId: credential?.id
    });

    return credential;
  }

  /**
   * Поиск учетных данных по ID
   */
  async findById(id: number): Promise<StoreCredential | null> {
    this.logger.debug('Finding credentials by ID', 'AuthRepository', { credentialId: id });

    const credential = await this.storeCredentialRepository.findOne({
      where: { id },
      relations: ['store'],
    });

    this.logger.debug('Credentials search by ID completed', 'AuthRepository', {
      credentialId: id,
      found: !!credential
    });

    return credential;
  }

  async findByStoreAndRole(storeId: number, role: EmployeeRole): Promise<StoreCredential | null> {
    this.logger.debug('Finding credentials by store and role', 'AuthRepository', { storeId, role });

    const credential = await this.storeCredentialRepository.findOne({
      where: { store: {id: storeId}, employeeRole: role },
      relations: ['store'],
    });

    this.logger.debug('Credentials search by store and role completed', 'AuthRepository', {
      storeId,
      role,
      found: !!credential
    });

    return credential;
  }

  async findByStoreId(storeId: number): Promise<StoreCredential[]> {
    this.logger.debug('Finding credentials by store ID', 'AuthRepository', { storeId });

    const credentials = await this.storeCredentialRepository.find({
      where: { store: { id: storeId } },
      relations: ['store'],
    });

    this.logger.debug('Credentials search by store ID completed', 'AuthRepository', {
      storeId,
      count: credentials.length
    });

    return credentials;
  }

  /**
   * Создание новых учетных данных
   */
  async create(credentialData: Partial<StoreCredential>): Promise<StoreCredential> {
    this.logger.debug('Creating new credentials', 'AuthRepository', {
      login: credentialData.login,
      storeId: credentialData.store?.id,
      role: credentialData.employeeRole
    });

    const newCredential = this.storeCredentialRepository.create(credentialData);
    this.logger.debug('New credential entity created', 'AuthRepository')
    const savedCredential = await this.storeCredentialRepository.save(newCredential);

    this.logger.debug('Credentials created successfully', 'AuthRepository', {
      credentialId: savedCredential.id, login: savedCredential.login
    });

    return savedCredential;
  }

  /**
   * Обновление времени последнего входа и сброс попыток входа
   */
  async setSuccessLogin(id: number): Promise<void> {
    this.logger.debug('Setting success Login start', 'AuthRepository', { credentialId: id });

    await this.storeCredentialRepository.update(id, {
      lastLogin: new Date(),
      loginAttempts: 0,
    });

    this.logger.debug('Setting success Login completed', 'AuthRepository', { credentialId: id });
  }

  /**
   * Увеличение количества неудачных попыток входа
   */
  async incrementLoginAttempts(id: number): Promise<void> {
    this.logger.debug('Incrementing login attempts', 'AuthRepository', { credentialId: id });

    await this.storeCredentialRepository
      .createQueryBuilder()
      .update(StoreCredential)
      .set({
        loginAttempts: () => 'login_attempts + 1',
        lastFailedLogin: new Date(),
      })
      .where('id = :id', { id })
      .execute();

    this.logger.debug('Login attempts incremented', 'AuthRepository', { credentialId: id });
  }

  async updateLogin(storeId: number, role: EmployeeRole, newLogin: string): Promise<UpdateResult> {
    this.logger.debug('Updating login', 'AuthRepository', { storeId, role, newLogin });

    const result = await this.storeCredentialRepository.update(
      { store: {id:storeId}, employeeRole: role },
      { login: newLogin }
    );

    this.logger.debug('Login update completed', 'AuthRepository', {
      storeId,
      role,
      affectedRows: result.affected
    });

    return result;
  }

  /**
   * Обновление пароля для конкретного магазина и роли
   */
  async updatePassword(storeId: number, role: EmployeeRole, passwordHash: string): Promise<UpdateResult> {
    this.logger.debug('Updating password hash', 'AuthRepository', { storeId, role });

    const result = await this.storeCredentialRepository.update(
      { store: {id:storeId}, employeeRole: role },
      { passwordHash, loginAttempts: 0 }
    );

    this.logger.debug('Password update completed', 'AuthRepository', {
      storeId,
      role,
      affectedRows: result.affected
    });

    return result;
  }

}
