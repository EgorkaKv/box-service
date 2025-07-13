import {IsNotEmpty, IsNumber, IsOptional} from 'class-validator';

export class ReserveBoxDto {
  static readonly RESERVATION_MINUTES = 5;
  /**
   * DTO for reserving a surprise box for an order.
   * @property {number} surpriseBoxId - The ID of the surprise box to reserve.
   * @property {number} customerId - The ID of the customer making the reservation.
   * @property {number} [reservationMinutes] - Optional number of minutes to reserve the box, defaults to 5 minutes.
   */
  @IsNotEmpty()
  @IsNumber()
  surpriseBoxId: number;

  @IsNotEmpty()
  @IsNumber()
  customerId: number;

  @IsOptional()
  @IsNumber()
  reservationMinutes?: number = ReserveBoxDto.RESERVATION_MINUTES;
}
