import {BadRequestException, Injectable, NotFoundException} from '@nestjs/common';
import { CustomerSurpriseBoxService } from './customer-surprise-box.service';
import { EmployeeSurpriseBoxService } from './employee-surprise-box.service';
// import { BaseSurpriseBoxService } from './base-surprise-box.service';
import {SurpriseBoxResponseDto} from "@surprise-box/dto/surprise-box-response.dto";
import {SurpriseBoxMapper} from "@surprise-box/entities/surprise-box.mapper";
import {ReserveBoxDto} from "@order/dto/reserve-box.dto";
import {OperationResult} from "@common/interfaces/operation-result.interface";
import {SurpriseBoxRepository} from "@surprise-box/repositories/surprise-box.repository";
import {AppLogger} from "@common/logger/app-logger.service";

/**
 * Главный сервис, который делегирует запросы к специализированным сервисам
 */
@Injectable()
export class SurpriseBoxService {
  constructor(
    protected readonly surpriseBoxRepository: SurpriseBoxRepository,
    protected readonly logger: AppLogger,
  ) {}

  /**
   * Получить бокс по идентификатору
   */
  async getBoxById(boxId: number): Promise<SurpriseBoxResponseDto> {
    this.logger.log('Fetching box by ID', 'BaseSurpriseBoxService');

    if (!boxId || boxId <= 0) {
      throw new BadRequestException('Valid box ID is required');
    }

    const box = await this.surpriseBoxRepository.findById(boxId);

    if (!box) {
      this.logger.debug('Box not found', 'BaseSurpriseBoxService', { boxId });
      throw new NotFoundException(`Box with ID ${boxId} not found`);
    }

    this.logger.log('Box retrieved successfully', 'BaseSurpriseBoxService', {
      boxId: box.id,
      status: box.status
    });

    return SurpriseBoxMapper.toSurpriseBoxResponseDto(box);
  }

  /**
   * Проверить существование бокса по идентификатору
   */
  async checkIfBoxExists(boxId: number): Promise<boolean> {
    this.logger.log('Checking if box exists', 'BaseSurpriseBoxService', { boxId });

    if (!boxId || boxId <= 0) {
      return false;
    }

    const box = await this.surpriseBoxRepository.findById(boxId);
    const exists = !!box;

    this.logger.log('Box existence check completed', 'BaseSurpriseBoxService', {
      boxId,
      exists
    });

    return exists;
  }

  /**
   * Зарезервировать бокс для заказа
   */
  async reserveBox(reserveBoxDto: ReserveBoxDto): Promise<OperationResult<{expiresAt: string}>> {
    this.logger.log('Starting box reservation process', 'BaseSurpriseBoxService', {
      boxId: reserveBoxDto.surpriseBoxId,
      customerId: reserveBoxDto.customerId
    });

    if (!reserveBoxDto.surpriseBoxId || reserveBoxDto.surpriseBoxId <= 0) {
      throw new BadRequestException('Valid surprise box ID is required');
    }

    if (!reserveBoxDto.customerId || reserveBoxDto.customerId <= 0) {
      throw new BadRequestException('Valid customer ID is required');
    }

    if (!reserveBoxDto.reservationMinutes || reserveBoxDto.reservationMinutes <= 0) {
      throw new BadRequestException('Valid reservation minutes is required');
    }

    const result = await this.surpriseBoxRepository.reserveBoxAtomic(reserveBoxDto);

    if (result.success) {
      this.logger.log('Box reservation completed successfully', 'BaseSurpriseBoxService', {
        boxId: reserveBoxDto.surpriseBoxId,
        customerId: reserveBoxDto.customerId,
        expiresAt: result.data?.expiresAt
      });
    } else {
      // TODO: change to error level
      this.logger.warn('Box reservation failed', 'BaseSurpriseBoxService', {
        boxId: reserveBoxDto.surpriseBoxId,
        customerId: reserveBoxDto.customerId,
        reason: result.message
      });
    }

    return result;
  }
}
