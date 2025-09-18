import {IsNotEmpty, IsNumber, IsOptional} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ReserveBoxDto {
  static readonly RESERVATION_MINUTES = 5;
  /**
   * DTO for reserving a surprise box for an order.
   * @property {number} surpriseBoxId - The ID of the surprise box to reserve.
   * @property {number} customerId - The ID of the customer making the reservation.
   * @property {number} [reservationMinutes] - Optional number of minutes to reserve the box, defaults to 5 minutes.
   */
  @ApiProperty({
    description: 'The ID of the surprise box to reserve',
    example: 42,
    type: Number
  })
  @IsNotEmpty()
  @IsNumber()
  surpriseBoxId: number;

  @ApiProperty({
    description: 'The ID of the customer making the reservation',
    example: 123,
    type: Number
  })
  @IsNotEmpty()
  @IsNumber()
  customerId: number;

  @ApiProperty({
    description: 'Number of minutes to reserve the box',
    example: 5,
    default: 5,
    required: false,
    type: Number
  })
  @IsOptional()
  @IsNumber()
  reservationMinutes?: number = ReserveBoxDto.RESERVATION_MINUTES;
}
