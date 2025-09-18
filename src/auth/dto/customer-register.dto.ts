import {IsEmail, IsNotEmpty, IsOptional, IsString} from "class-validator";
import { ApiProperty } from '@nestjs/swagger';

export class CustomerRegisterDto {
  @ApiProperty({
    description: 'Customer email address',
    example: 'customer@example.com',
    type: String
  })
  @IsString()
  @IsNotEmpty({ message: 'Email is required' })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'Customer password (minimum 6 characters recommended)',
    example: 'mySecurePassword123',
    type: String
  })
  @IsString()
  @IsNotEmpty({ message: 'Password is required' })
  password: string;

  @ApiProperty({
    description: 'Customer display name',
    example: 'John Doe',
    required: false,
    type: String
  })
  @IsString()
  @IsOptional()
  customerName?: string;

  @ApiProperty({
    description: 'Customer gender',
    example: 'male',
    enum: ['male', 'female', 'other'],
    required: false,
    type: String
  })
  @IsString()
  @IsOptional()
  gender?: string;

  @ApiProperty({
    description: 'URL to customer profile image',
    example: 'https://example.com/avatars/user123.jpg',
    required: false,
    type: String
  })
  @IsString()
  @IsOptional()
  profileImageUrl?: string;
}