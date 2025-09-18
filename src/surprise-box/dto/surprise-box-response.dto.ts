import { BoxStatus } from '../entities/surprise-box.entity';
import { ApiProperty } from '@nestjs/swagger';

export class SurpriseBoxResponseDto {
  @ApiProperty({
    description: 'Unique surprise box identifier',
    example: 42
  })
  id: number;

  @ApiProperty({
    description: 'Box template ID',
    example: 15
  })
  boxTemplateId: number;

  @ApiProperty({
    description: 'Store ID',
    example: 3
  })
  storeId: number;

  @ApiProperty({
    description: 'Category ID',
    example: 2
  })
  categoryId: number;

  @ApiProperty({
    description: 'Business name',
    example: 'КАФЕ РИНОК'
  })
  businessName: string;

  @ApiProperty({
    description: 'Store address',
    example: 'вул. Січових Стрільців, 8'
  })
  storeAddress: string;

  @ApiProperty({
    description: 'Store city',
    example: 'Львів'
  })
  storeCity: string;

  @ApiProperty({
    description: 'Box title',
    example: 'Солодощі від КАФЕ РИНОК'
  })
  title: string;

  @ApiProperty({
    description: 'Box content description',
    example: 'Тістечка, торти, бісквіти, десерти до кави',
    required: false
  })
  description?: string;

  @ApiProperty({
    description: 'Category name',
    example: 'Солодощі',
    required: false
  })
  categoryName?: string;

  @ApiProperty({
    description: 'Original price in cents',
    example: 27000
  })
  originalPrice: number;

  @ApiProperty({
    description: 'Discounted price in cents',
    example: 13500
  })
  discountedPrice: number;

  @ApiProperty({
    description: 'Box image URL',
    example: 'https://img.com/box15.png',
    required: false
  })
  imageUrl?: string;

  @ApiProperty({
    description: 'Pickup start time',
    example: '2024-01-01T20:00:00Z'
  })
  pickupStartTime: Date;

  @ApiProperty({
    description: 'Pickup end time',
    example: '2024-01-01T21:00:00Z'
  })
  pickupEndTime: Date;

  @ApiProperty({
    description: 'Sale start time',
    example: '2024-01-01T08:00:00Z'
  })
  saleStartTime: Date;

  @ApiProperty({
    description: 'Sale end time',
    example: '2024-01-01T21:00:00Z'
  })
  saleEndTime: Date;

  @ApiProperty({
    description: 'Box status',
    enum: BoxStatus,
    example: 'available'
  })
  status: BoxStatus;

  @ApiProperty({
    description: 'Customer ID who reserved the box',
    example: null,
    required: false
  })
  reservedBy?: number;

  @ApiProperty({
    description: 'Reservation time',
    example: null,
    required: false
  })
  reservedAt?: Date;

  @ApiProperty({
    description: 'Reservation expiration time',
    example: null,
    required: false
  })
  reservationExpiresAt?: Date;

  @ApiProperty({
    description: 'Record creation time',
    example: '2024-01-01T08:00:00Z'
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Last update time',
    example: '2024-01-01T08:00:00Z'
  })
  updatedAt: Date;

  // Related data
  @ApiProperty({
    description: 'Box template information',
    required: false,
    type: Object,
    example: {
      id: 15,
      title: 'Солодощі від КАФЕ РИНОК',
      description: 'Artisanal desserts and sweets',
      imageUrl: 'https://img.com/template15.png'
    }
  })
  boxTemplate?: {
    id: number;
    title: string;
    description?: string;
    imageUrl?: string;
  };

  @ApiProperty({
    description: 'Store information',
    required: false,
    type: Object,
    example: {
      id: { type: 'number', example: 3 },
      businessName: { type: 'string', example: 'КАФЕ РИНОК' },
      address: { type: 'string', example: 'вул. Січових Стрільців, 8' },
      city: { type: 'string', example: 'Львів' },
      storeImageUrl: { type: 'string', example: 'https://img.com/sichovi8.png' }
    }
  })
  store?: {
    id: number;
    businessName: string;
    address: string;
    city: string;
    storeImageUrl?: string;
  };

  @ApiProperty({
    description: 'Category information',
    required: false,
    type: Object,
    example: {
      id: { type: 'number', example: 2 },
      name: { type: 'string', example: 'Солодощі' },
      description: { type: 'string', example: 'Тістечка, торти, бісквіти, десерти до кави' }
    }
  })
  category?: {
    id: number;
    name: string;
    description?: string;
  };
}
