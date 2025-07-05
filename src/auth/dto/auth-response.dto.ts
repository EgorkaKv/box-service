import { IsString, IsNotEmpty } from 'class-validator';

export class AuthResponseDto {
  accessToken: string;
  refreshToken: string;
  storeId: number;
  login: string;
  expiresIn: number;
}

export class RefreshTokenDto {
  @IsString()
  @IsNotEmpty({ message: 'Refresh токен обязателен' })
  refreshToken: string;
}
