import { IsString, IsNotEmpty, IsNumber, IsOptional, IsEnum, MinLength } from 'class-validator';
import { EmployeeRole } from '../entities/store-credential.entity';

export class RegisterEmployeeDto {
  @IsNumber()
  @IsNotEmpty({ message: 'ID магазина обязателен' })
  storeId: number;

  @IsString()
  @IsNotEmpty({ message: 'Логин обязателен' })
  login: string;

  @IsString()
  @IsNotEmpty({ message: 'Пароль обязателен' })
  @MinLength(6, { message: 'Пароль должен содержать минимум 6 символов' })
  password: string;

  @IsEnum(EmployeeRole, { message: 'Роль должна быть staff или manager' })
  @IsOptional()
  role?: EmployeeRole = EmployeeRole.STAFF;
}

export class RegisterEmployeeResponseDto {
  id: number;
  storeId: number;
  login: string;
  employeeRole: EmployeeRole;
  createdAt: Date;
}
