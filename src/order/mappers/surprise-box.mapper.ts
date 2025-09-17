import { Injectable } from '@nestjs/common';
import { BaseMapper } from '@common/mapper/base.mapper';
import { SurpriseBox } from '@surprise-box/entities/surprise-box.entity';

/**
 * DTO для представления surprise box в ответе заказа
 */
export interface OrderSurpriseBoxDto {
  id: number;
  title: string;
  originalPrice: number;
  discountedPrice: number;
  pickupStartTime: Date;
  pickupEndTime: Date;
  imageUrl?: string;
}

/**
 * Маппер для SurpriseBox в контексте заказа
 */
@Injectable()
export class SurpriseBoxMapper extends BaseMapper<SurpriseBox, OrderSurpriseBoxDto> {

  toDto(surpriseBox: SurpriseBox): OrderSurpriseBoxDto {
    return {
      id: surpriseBox.id,
      title: this.safeGet(surpriseBox.title, ''),
      originalPrice: this.safeGet(surpriseBox.originalPrice, 0),
      discountedPrice: this.safeGet(surpriseBox.discountedPrice, 0),
      pickupStartTime: surpriseBox.pickupStartTime,
      pickupEndTime: surpriseBox.pickupEndTime,
      imageUrl: surpriseBox.imageUrl,
    };
  }
}
