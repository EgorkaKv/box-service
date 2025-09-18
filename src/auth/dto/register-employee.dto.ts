import { IsString, IsNotEmpty, IsNumber, IsOptional, IsEnum, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { EmployeeRole } from '../entities/store-credential.entity';

export class RegisterEmployeeDto {
  @ApiProperty({
    description: 'Store ID where the employee will work',
    example: 1,
    type: Number
  })
  @IsNumber()
  @IsNotEmpty({ message: 'ID магазина обязателен' })
  storeId: number;

  @ApiProperty({
    description: 'Employee login (username or email)',
    example: 'newemployee@company.com',
    type: String
  })
  @IsString()
  @IsNotEmpty({ message: 'Логин обязателен' })
  login: string;

  @ApiProperty({
    description: 'Employee password (minimum 6 characters)',
    example: 'securePassword123',
    type: String,
    minLength: 6
  })
  @IsString()
  @IsNotEmpty({ message: 'Пароль обязателен' })
  @MinLength(6, { message: 'Пароль должен содержать минимум 6 символов' })
  password: string;

  @ApiProperty({
    description: 'Employee role in the store',
    enum: EmployeeRole,
    example: EmployeeRole.STAFF,
    default: EmployeeRole.STAFF,
    required: false
  })
  @IsEnum(EmployeeRole, { message: 'Роль должна быть staff или manager' })
  @IsOptional()
  role: EmployeeRole = EmployeeRole.STAFF;
}
