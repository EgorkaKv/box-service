import {IsNotEmpty, IsNumber, IsString} from "class-validator";
import { ApiProperty } from '@nestjs/swagger';

export class CompleteOrderDto {
  @ApiProperty({
    description: 'The ID of the order to complete',
    example: 123,
    type: Number
  })
  @IsNotEmpty()
  @IsNumber()
  orderId: number;

  @ApiProperty({
    description: 'Pickup code provided by customer for order verification',
    example: 'ABC123',
    type: String
  })
  @IsNotEmpty()
  @IsString()
  pickupCode: string;
}