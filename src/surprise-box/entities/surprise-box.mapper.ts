import { SurpriseBox } from './surprise-box.entity';
import { SurpriseBoxResponseDto } from '../dto/surprise-box-response.dto';


export class SurpriseBoxMapper {
  static toSurpriseBoxResponseDto(box: SurpriseBox): SurpriseBoxResponseDto {
    const dto = new SurpriseBoxResponseDto();

    dto.id = box.id;
    dto.boxTemplateId = box.boxTemplateId;
    dto.storeId = box.storeId;
    dto.categoryId = box.categoryId;
    dto.businessName = box.businessName;
    dto.storeAddress = box.storeAddress;
    dto.storeCity = box.storeCity;
    dto.title = box.title;
    dto.description = box.description;
    dto.categoryName = box.categoryName;
    dto.originalPrice = box.originalPrice;
    dto.discountedPrice = box.discountedPrice;
    dto.imageUrl = box.imageUrl;
    dto.pickupStartTime = box.pickupStartTime;
    dto.pickupEndTime = box.pickupEndTime;
    dto.saleStartTime = box.saleStartTime;
    dto.saleEndTime = box.saleEndTime;
    dto.status = box.status;
    dto.reservedBy = box.reservedBy;
    dto.reservedAt = box.reservedAt;
    dto.reservationExpiresAt = box.reservationExpiresAt;
    dto.createdAt = box.createdAt;
    dto.updatedAt = box.updatedAt;

    return dto;
  }
}
