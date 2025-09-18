import { IsString, IsNotEmpty } from 'class-validator';

export class EmployeeLoginDto {
  @IsString()
  @IsNotEmpty({ message: 'Логин обязателен' })
  login: string;

  @IsString()
  @IsNotEmpty({ message: 'Пароль обязателен' })
  password: string;
}
