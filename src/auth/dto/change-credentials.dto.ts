import { IsString, IsNotEmpty, IsNumber, IsOptional, IsEnum, MinLength } from 'class-validator';
import { EmployeeRole } from '../entities/store-credential.entity';

export class ChangeLoginDto {
  @IsNumber()
  @IsNotEmpty({ message: 'ID магазина обязателен' })
  storeId: number;

  @IsEnum(EmployeeRole, { message: 'Роль должна быть staff или manager' })
  @IsOptional()
  role: EmployeeRole = EmployeeRole.STAFF;

  @IsString()
  @IsNotEmpty({ message: 'Новый логин обязателен' })
  newLogin: string;
}

export class ChangePasswordDto {
  @IsNumber()
  @IsNotEmpty({ message: 'ID магазина обязателен' })
  storeId: number;

  @IsEnum(EmployeeRole, { message: 'Роль должна быть staff или manager' })
  @IsOptional()
  role?: EmployeeRole = EmployeeRole.STAFF;

  @IsString()
  @IsNotEmpty({ message: 'Новый пароль обязателен' })
  @MinLength(6, { message: 'Пароль должен содержать минимум 6 символов' })
  newPassword: string;
}
