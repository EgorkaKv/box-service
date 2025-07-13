/**
 * Базовый интерфейс для ответов операций
 */
export interface BaseOperationResult {
  success: boolean;
  message: string;
}

/**
 * Интерфейс для операций с возвратом данных
 */
export interface OperationResult<T = any> extends BaseOperationResult {
  data?: T | null;
}

/*export interface CreateOrderResult extends BaseOperationResult {
  order_id: number;
  pickup_code: string;
}*/
