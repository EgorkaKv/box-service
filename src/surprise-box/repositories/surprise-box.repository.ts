import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SurpriseBox, BoxStatus } from '../entities/surprise-box.entity';
import {ReserveBoxDto} from "@order/dto/reserve-box.dto";
import {OperationResult} from "@common/interfaces/operation-result.interface";
import {operationResultHelper} from "@common/interfaces/operation-result.helper";

@Injectable()
export class SurpriseBoxRepository {
  constructor(
    @InjectRepository(SurpriseBox)
    private readonly surpriseBoxRepository: Repository<SurpriseBox>,
  ) {}

  /**
   * Получение активных боксов по геолокации
   */
  async findNearby(
    latitude: number,
    longitude: number,
    radius: number,
  ): Promise<SurpriseBox[]> {
    // Используем функцию ST_DWithin для поиска точек в радиусе
    const query = this.surpriseBoxRepository
      .createQueryBuilder('box')
      .where(`box.status = :status`, { status: BoxStatus.ACTIVE })
      .andWhere(
        `ST_DWithin(
          box.store_location,
          ST_SetSRID(ST_MakePoint(:longitude, :latitude), 4326),
          :radius
        )`,
        { latitude, longitude, radius },
      )
      .andWhere('box.sale_end_time > NOW()')
      .andWhere('box.sale_start_time <= NOW()');

    return query.getMany();
  }

  /**
   * Получение активных боксов по городу
   */
  async findByCity(cityId: string): Promise<SurpriseBox[]> {
    return this.surpriseBoxRepository.find({
      where: {
        storeCity: cityId,
        status: BoxStatus.ACTIVE,
      },
    });
  }

  /**
   * Получение всех боксов
   */
  async findAll(): Promise<SurpriseBox[]> {
    return this.surpriseBoxRepository.find({
      where: {
        status: BoxStatus.ACTIVE,
      },
    });
  }

  /**
   * Получение конкретного бокса по ID
   */
  async findById(boxId: number): Promise<SurpriseBox | null> {
    return this.surpriseBoxRepository.findOne({
      where: { id: boxId },
      relations: ['store', 'category', 'boxTemplate'],
    });
  }

  /**
   * Получение доступных для покупки боксов
   * Вспомогательный метод для других запросов
   */
  async findAvailable(): Promise<SurpriseBox[]> {
    return this.surpriseBoxRepository
      .createQueryBuilder('box')
      .where('box.status = :status', { status: BoxStatus.ACTIVE })
      .andWhere('box.sale_start_time <= NOW()')
      .andWhere('box.sale_end_time > NOW()')
      .getMany();
  }

  async findActiveBoxesByStore(storeId: number): Promise<SurpriseBox[]> {
    return this.surpriseBoxRepository.find({
      where: {
        storeId,
        status: BoxStatus.ACTIVE,
      },
      relations: ['boxTemplate', 'store', 'category'],
      order: {
        createdAt: 'DESC',
      },
    });
  }

  // Вызов атомарной функции резервирования
  async reserveBoxAtomic(reserveBoxDto: ReserveBoxDto): Promise<OperationResult<{expiresAt: string}>> {
    const result = await this.surpriseBoxRepository.query(
      'SELECT * FROM reserve_surprise_box_atomic($1, $2, $3)', [
        reserveBoxDto.surpriseBoxId,
        reserveBoxDto.customerId,
        reserveBoxDto.reservationMinutes,
      ]
    );

    const queryResult = operationResultHelper(result[0]);

    return queryResult;
  }
}