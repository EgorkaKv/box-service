import { IsString, IsNotEmpty, IsNumber, IsOptional, IsEnum, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { EmployeeRole } from '../entities/store-credential.entity';

export class ChangeLoginDto {
  @ApiProperty({
    description: 'Store ID where the employee works',
    example: 1,
    type: Number
  })
  @IsNumber()
  @IsNotEmpty({ message: 'ID магазина обязателен' })
  storeId: number;

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

  @ApiProperty({
    description: 'New login for the employee',
    example: 'newlogin@company.com',
    type: String
  })
  @IsString()
  @IsNotEmpty({ message: 'Новый логин обязателен' })
  newLogin: string;
}

export class ChangePasswordDto {
  @ApiProperty({
    description: 'Store ID where the employee works',
    example: 1,
    type: Number
  })
  @IsNumber()
  @IsNotEmpty({ message: 'ID магазина обязателен' })
  storeId: number;

  @ApiProperty({
    description: 'Employee role in the store',
    enum: EmployeeRole,
    example: EmployeeRole.STAFF,
    default: EmployeeRole.STAFF,
    required: false
  })
  @IsEnum(EmployeeRole, { message: 'Роль должна быть staff или manager' })
  @IsOptional()
  role?: EmployeeRole = EmployeeRole.STAFF;

  @ApiProperty({
    description: 'New password for the employee (minimum 6 characters)',
    example: 'newSecurePassword123',
    type: String,
    minLength: 6
  })
  @IsString()
  @IsNotEmpty({ message: 'Новый пароль обязателен' })
  @MinLength(6, { message: 'Пароль должен содержать минимум 6 символов' })
  newPassword: string;
}
