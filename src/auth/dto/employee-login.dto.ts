import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class EmployeeLoginDto {
  @ApiProperty({
    description: 'Employee login (username or email)',
    example: 'employee@company.com',
    type: String
  })
  @IsString()
  @IsNotEmpty({ message: 'Логин обязателен' })
  login: string;

  @ApiProperty({
    description: 'Employee password',
    example: 'employeePassword123',
    type: String
  })
  @IsString()
  @IsNotEmpty({ message: 'Пароль обязателен' })
  password: string;
}
