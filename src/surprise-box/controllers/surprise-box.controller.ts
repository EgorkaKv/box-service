import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { SurpriseBoxService } from '../services/surprise-box.service';
import { SurpriseBox } from '../entities/surprise-box.entity';

@Controller('boxes')
export class SurpriseBoxController {
  constructor(private readonly surpriseBoxService: SurpriseBoxService) {}

  // GET /boxes/nearby?latitude&longitude&radius
  @Get('nearby')
  async getNearbyBoxes(
    @Query('latitude') latitude: string,
    @Query('longitude') longitude: string,
    @Query('radius') radius: string,
  ) {
    // Вызов сервиса для получения боксов по геолокации
    return this.surpriseBoxService.getNearbyBoxes(
      parseFloat(latitude),
      parseFloat(longitude),
      parseFloat(radius),
    );
  }

  // GET /boxes/city/:idCity
  @Get('city/:idCity')
  async getBoxesByCity(@Param('idCity') idCity: string) {
    // Вызов сервиса для получения боксов по ID города
    return this.surpriseBoxService.getBoxesByCity(idCity);
  }

  // GET /boxes/all
  @Get('all')
  async getAllBoxes() {
    // Вызов сервиса для получения всех боксов
    return this.surpriseBoxService.getAllBoxes();
  }

  // GET /boxes/:boxId
  @Get(':boxId')
  async getBoxById(@Param('boxId') boxId: string) {
    // Вызов сервиса для получения деталей конкретного бокса
    return this.surpriseBoxService.getBoxById(Number(boxId));
  }

  @Get('store/:storeId')
  async getActiveBoxesByStore(
    @Param('storeId', ParseIntPipe) storeId: number,
  ): Promise<SurpriseBox[]> {
    return this.surpriseBoxService.getActiveBoxesByStore(storeId);
  }
}