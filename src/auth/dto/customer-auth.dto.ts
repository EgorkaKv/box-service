import { IsNotEmpty, IsString } from 'class-validator';

export class CustomerLoginDto {
  @IsNotEmpty()
  @IsString()
  login: string; // может быть email или phone

  @IsNotEmpty()
  @IsString()
  password: string;
}

export class CustomerAuthResponseDto {
  accessToken: string;
  refreshToken: string;
  customer?: {
    id: number;
    phone?: string;
    email?: string;
  }
}

