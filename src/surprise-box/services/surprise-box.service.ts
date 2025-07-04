import { Injectable, NotFoundException } from '@nestjs/common';
import { SurpriseBoxRepository } from '../repositories/surprise-box.repository';
import { SurpriseBox } from '../entities/surprise-box.entity';

@Injectable()
export class SurpriseBoxService {
  constructor(private readonly surpriseBoxRepository: SurpriseBoxRepository) {}

  /**
   * Получить боксы рядом с заданными координатами
   */
  async getNearbyBoxes(
    latitude: number,
    longitude: number,
    radius: number,
  ): Promise<SurpriseBox[]> {
    return this.surpriseBoxRepository.findNearby(latitude, longitude, radius);
  }

  /**
   * Получить боксы по идентификатору города
   */
  async getBoxesByCity(cityId: string): Promise<SurpriseBox[]> {
    return this.surpriseBoxRepository.findByCity(cityId);
  }

  /**
   * Получить все активные боксы
   */
  async getAllBoxes(): Promise<SurpriseBox[]> {
    return this.surpriseBoxRepository.findAll();
  }

  /**
   * Получить бокс по идентификатору
   * @throws NotFoundException если бокс не найден
   */
  async getBoxById(boxId: number): Promise<SurpriseBox> {
    const box = await this.surpriseBoxRepository.findById(boxId);

    if (!box) {
      throw new NotFoundException(`Бокс с ID ${boxId} не найден`);
    }

    return box;
  }

  /**
   * Проверить существование бокса по идентификатору
   */
  async checkIfBoxExists(boxId: number): Promise<boolean> {
    const box = await this.surpriseBoxRepository.findById(boxId);
    return !!box;
  }
}