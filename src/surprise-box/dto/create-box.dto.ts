import { IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class CreateBoxDto {
  @ApiProperty({
    description: 'Template ID to use for creating surprise boxes',
    example: 1,
    type: Number,
  })
  @Type(() => Number)
  @IsInt({ message: 'templateId must be integer' })
  templateId: number;

  @ApiProperty({
    description: 'Number of surprise boxes to create',
    example: 10,
    minimum: 1,
    maximum: 49,
    type: Number,
  })
  @Type(() => Number)
  @IsInt({ message: 'count must be integer' })
  @Min(1, { message: 'count must be more than 0' })
  @Max(49, { message: 'count must be less than 50' })
  count: number;
}
