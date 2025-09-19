import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { SurpriseBox } from '../entities/surprise-box.entity';
import { ReserveBoxDto } from "@order/dto/reserve-box.dto";
import { OperationResult } from "@common/interfaces/operation-result.interface";
import { operationResultHelper } from "@common/interfaces/operation-result.helper";
import { AppLogger } from '@common/logger/app-logger.service';

@Injectable()
export class SurpriseBoxRepository {

  constructor(
    @InjectRepository(SurpriseBox)
    private readonly repository: Repository<SurpriseBox>,
    private readonly logger: AppLogger,
  ) {}

  /**
   * Получение конкретного бокса по ID
   */
  async findById(boxId: number): Promise<SurpriseBox | null> {
    this.logger.debug('Finding box by ID', 'SurpriseBoxRepository', { boxId });

    const box = await this.repository.findOne({
      where: { id: boxId },
      relations: ['store', 'category', 'boxTemplate'],
    });

    this.logger.debug('Box search by ID completed', 'SurpriseBoxRepository', {
      boxId,
      found: !!box,
      status: box?.status
    });

    return box;
  }

  /**
   * Выполнить запрос с подсчетом (для пагинации)
   */
  async executeQueryWithCount(queryBuilder: SelectQueryBuilder<SurpriseBox>): Promise<[SurpriseBox[], number]> {
    return queryBuilder.getManyAndCount();
  }

  /**
   * Получить QueryBuilder для создания сложных запросов
   */
  createQueryBuilder(alias: string = 'surprise_box'): SelectQueryBuilder<SurpriseBox> {
    return this.repository.createQueryBuilder(alias);
  }

  /**
   * Вызов атомарной функции резервирования
   */
  async reserveBoxAtomic(reserveBoxDto: ReserveBoxDto, customerId: number): Promise<OperationResult<{expiresAt: string}>> {
    this.logger.debug('Executing reserve_surprise_box_atomic function', 'SurpriseBoxRepository', {
      boxId: reserveBoxDto.surpriseBoxId,
      customerId: customerId,
      reservationMinutes: reserveBoxDto.reservationMinutes
    });

    const result = await this.repository.query(
      'SELECT * FROM reserve_surprise_box_atomic($1, $2, $3)',
      [
        reserveBoxDto.surpriseBoxId,
        customerId,
        reserveBoxDto.reservationMinutes,
      ]
    );

    const queryResult = operationResultHelper(result[0]);

    this.logger.debug('Database function executed', 'SurpriseBoxRepository', {
      success: queryResult.success,
      boxId: reserveBoxDto.surpriseBoxId,
      customerId: customerId,
      expiresAt: queryResult.data?.expiresAt
    });

    return queryResult;
  }

  /**
   * вызов функции создания нового набора
   */
  async createBoxFromTemplate(templateId: number, count: number): Promise<OperationResult<{ids:number[]}>> {
    this.logger.debug('Executing database function create_surprise_box_from_template()', 'SurpriseBoxRepository', {templateId, count});

    try {
      const result = await this.repository.query(
        'SELECT * FROM create_surprise_box_from_template($1, $2)', [templateId, count]
      )

      const ids: number[] = result.map((row: any) => row.create_surprise_box_from_template);

      this.logger.debug('Database function executed', 'SurpriseBoxRepository', ids)
      return {
        success: true,
        message: '',
        data: { ids }
      }
    } catch (error) {
      this.logger.debug(`Catch exception while executing database function: ${error.message}`, 'SurpriseBoxRepository', {error})
      return {
        message: error.message,
        success: false,
        data: { ids: [] }
      }
    }
  }

}