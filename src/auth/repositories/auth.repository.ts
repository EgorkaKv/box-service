import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StoreCredential } from '../entities/store-credential.entity';

@Injectable()
export class AuthRepository {
  constructor(
    @InjectRepository(StoreCredential)
    private readonly storeCredentialRepository: Repository<StoreCredential>,
  ) {}

  async findByLogin(login: string): Promise<StoreCredential | null> {
    return this.storeCredentialRepository.findOne({
      where: { login },
      relations: ['store'],
    });
  }

  async updateLastLogin(id: number): Promise<void> {
    await this.storeCredentialRepository.update(id, {
      lastLogin: new Date(),
      loginAttempts: 0,
    });
  }

  async incrementLoginAttempts(id: number): Promise<void> {
    await this.storeCredentialRepository.update(id, {
      loginAttempts: () => 'login_attempts + 1',
      lastFailedLogin: new Date(),
    });
  }

  async resetLoginAttempts(id: number): Promise<void> {
    await this.storeCredentialRepository.update(id, {
      loginAttempts: 0,
    });
  }
}
