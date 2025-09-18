import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import {Customer} from "@customer/entities/customer.entity";

interface CustomerProps {
  id: number;
  phone?: string;
  email?: string;
}

export class VerifyFirebaseTokenDto {
  @ApiProperty({
    description: 'Firebase ID token from SMS verification',
    example: 'eyJhbGciOiJSUzI1NiIsImtpZCI6IjFlOWdkbTJhYWJmNmFiYzNkM...'
  })
  @IsNotEmpty()
  @IsString()
  idToken: string;
}

export class CustomerRefreshTokenDto {
  @ApiProperty({
    description: 'JWT refresh token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
  })
  @IsNotEmpty()
  @IsString()
  refreshToken: string;
}

export class DecodeJwtDto {
  @ApiProperty({
    description: 'JWT token to decode',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
  })
  @IsNotEmpty()
  @IsString()
  token: string;
}

export class CustomerLoginDto {
  @ApiProperty({
    description: 'User login - can be email or phone number',
    example: 'user@example.com',
    type: String
  })
  @IsNotEmpty()
  @IsString()
  login: string; // может быть email или phone

  @ApiProperty({
    description: 'User password',
    example: 'mySecretPassword123',
    type: String
  })
  @IsNotEmpty()
  @IsString()
  password: string;
}

export class CustomerAuthResponseDto {
  @ApiProperty({
    description: 'JWT access token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
  })
  accessToken: string;

  @ApiProperty({
    description: 'JWT refresh token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
  })
  refreshToken: string;

  @ApiProperty({
    description: 'Customer information',
    required: false,
    type: Object,
    example: {
      id: 12345,
      phone: '+1234567890',
      email: 'customer@example.com'
    }
  })
  customer?: {
    id: number;
    phone?: string;
    email?: string;
  }
}

export class DecodedTokenResponseDto {
  @ApiProperty({
    description: 'Decoded token payload as string',
    example: '12345'
  })
  decoded: string;
}
