import { BoxStatus } from '../entities/surprise-box.entity';

export class SurpriseBoxResponseDto {
  id: number;
  boxTemplateId: number;
  storeId: number;
  categoryId: number;
  businessName: string;
  storeAddress: string;
  storeCity: string;
  title: string;
  description?: string;
  categoryName?: string;
  originalPrice: number;
  discountedPrice: number;
  imageUrl?: string;
  pickupStartTime: Date;
  pickupEndTime: Date;
  saleStartTime: Date;
  saleEndTime: Date;
  status: BoxStatus;
  reservedBy?: number;
  reservedAt?: Date;
  reservationExpiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;

  // Связанные данные
  boxTemplate?: {
    id: number;
    title: string;
    description?: string;
    imageUrl?: string;
  };

  store?: {
    id: number;
    businessName: string;
    address: string;
    city: string;
    storeImageUrl?: string;
  };

  category?: {
    id: number;
    name: string;
    description?: string;
  };
}
