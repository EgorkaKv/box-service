import { IsNotEmpty, IsString } from 'class-validator';

export class VerifyFirebaseTokenDto {
  @IsNotEmpty()
  @IsString()
  idToken: string;
}

export class CustomerRefreshTokenDto {
  @IsNotEmpty()
  @IsString()
  refreshToken: string;
}

export class DecodeJwtDto {
  @IsNotEmpty()
  @IsString()
  token: string;
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

export class DecodedTokenResponseDto {
  decoded: string;
}
