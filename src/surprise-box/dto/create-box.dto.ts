import { IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateBoxDto {
  @Type(() => Number)
  @IsInt({ message: 'templateId must be integer' })
  templateId: number;

  @Type(() => Number)
  @IsInt({ message: 'count must be integer' })
  @Min(1, { message: 'count must be more than 0' })
  @Max(49, { message: 'count must be less than 50' })
  count: number;
}
