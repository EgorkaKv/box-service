import { OperationResult } from './operation-result.interface';

// Преобразует snake_case ключи в camelCase
function toCamelCase(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map(toCamelCase);
  }
  if (obj !== null && typeof obj === 'object') {
    return Object.fromEntries(
      Object.entries(obj).map(([key, value]) => [
        key.replace(/_([a-z])/g, (_, c) => c.toUpperCase()),
        toCamelCase(value),
      ])
    );
  }
  return obj;
}

// Универсальный хелпер для формирования OperationResult
export function operationResultHelper<T = any>(dbResult: any): OperationResult<T> {
  const { success, message, ...rest } = toCamelCase(dbResult);
  return {
    success,
    message,
    data: Object.keys(rest).length ? rest : undefined,
  };
}