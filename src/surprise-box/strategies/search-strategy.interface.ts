import { SelectQueryBuilder } from 'typeorm';
import { SurpriseBox } from '../entities/surprise-box.entity';
import { PaginationDto } from '@common/pagination/pagination.dto';

/**
 * Базовый интерфейс для стратегий поиска surprise boxes
 */
export interface SearchStrategy<T extends PaginationDto = PaginationDto> {
  /**
   * Применить фильтры к запросу
   */
  applyFilters(queryBuilder: SelectQueryBuilder<SurpriseBox>, filters: T): void;

  /**
   * Валидировать параметры фильтра
   */
  validateFilters(filters: T): void;

  /**
   * Получить тип стратегии
   */
  getType(): string;
}
