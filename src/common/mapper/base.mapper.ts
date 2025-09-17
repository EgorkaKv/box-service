/**
 * Базовый абстрактный класс для всех мапперов
 * предоставляет общую функциональность и типобезопасность
 */
export abstract class BaseMapper<TEntity, TDto> {
  /**
   * Основной метод маппинга из entity в DTO
   */
  abstract toDto(entity: TEntity): TDto;

  /**
   * Маппинг массива entities в массив DTO
   */
  toDtoArray(entities: TEntity[]): TDto[] {
    if (!entities || !Array.isArray(entities)) {
      return [];
    }

    return entities.map(entity => this.toDto(entity));
  }

  /**
   * Безопасная проверка на null/undefined
   */
  protected isValidEntity(entity: any): boolean {
    return entity !== null && entity !== undefined;
  }

  /**
   * Безопасное извлечение значения с fallback
   */
  protected safeGet<T>(value: T | null | undefined, fallback: T): T {
    return value ?? fallback;
  }

  /**
   * Безопасное маппинг вложенного объекта
   */
  protected safeMap<TNestedEntity, TNestedDto>(
    entity: TNestedEntity | null | undefined,
    mapper: (entity: TNestedEntity) => TNestedDto
  ): TNestedDto | undefined {
    return this.isValidEntity(entity) ? mapper(entity!) : undefined;
  }
}
