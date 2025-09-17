import { Injectable } from '@nestjs/common';
import { BaseMapper } from '@common/mapper/base.mapper';
import { Store } from '@store/entities/store.entity';

/**
 * DTO для представления магазина в ответе заказа
 */
export interface OrderStoreDto {
  id: number;
  businessName: string;
  address: string;
  city: string;
  storeImageUrl?: string;
}

/**
 * Маппер для Store в контексте заказа
 */
@Injectable()
export class StoreMapper extends BaseMapper<Store, OrderStoreDto> {

  toDto(store: Store): OrderStoreDto {
    return {
      id: store.id,
      businessName: this.safeGet(store.business.business_name, ''),
      address: this.safeGet(store.address, ''),
      city: this.safeGet(store.city, ''),
      storeImageUrl: store.storeImageUrl,
    };
  }
}
