import {IsEmail, IsNotEmpty, IsOptional, IsString} from "class-validator";

export class CustomerRegisterDto {
  @IsString()
  @IsNotEmpty({ message: 'Email is required' })
  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty({ message: 'Password is required' })
  password: string;

  @IsString()
  @IsOptional()
  customerName?: string;

  @IsString()
  @IsOptional()
  gender?: string;

  @IsString()
  @IsOptional()
  profileImageUrl?: string;
}