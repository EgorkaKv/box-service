import {EmployeeRole} from "@auth/entities/store-credential.entity";

/**
 * Базовый интерфейс для всех JWT payload
 */
export interface BaseJwtPayload {
  sub: number; // ID пользователя
  iat?: number; // issued at
  exp?: number; // expiration time
}

/**
 * Payload для токена работника магазина
 */
export interface EmployeeJwtPayload extends BaseJwtPayload {
  sub: number; // credential ID
  storeId: number;
  login: string;
  type: EmployeeRole;
}

/**
 * Payload для токена клиента
 */
export interface CustomerJwtPayload extends BaseJwtPayload {
  sub: number; // customer ID
  type: 'customer';
  phone?: string;
  email?: string;
}

/**
 * Payload для токена администратора
 */
export interface AdminJwtPayload extends BaseJwtPayload {
  sub: number; // admin ID
  login: string;
  type: 'admin';
}

/**
 * Объединенный тип для всех возможных payload
 */
export type JwtPayload = EmployeeJwtPayload | CustomerJwtPayload | AdminJwtPayload;
