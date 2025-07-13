import {IsNotEmpty, IsNumber, IsString} from "class-validator";

export class CompleteOrderDto{
  @IsNotEmpty()
  @IsNumber()
  orderId: number;

  @IsNotEmpty()
  @IsString()
  pickupCode: string;
}