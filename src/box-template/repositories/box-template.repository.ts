import {Injectable} from "@nestjs/common";
import {InjectRepository} from "@nestjs/typeorm";
import {SurpriseBox} from "@surprise-box/entities/surprise-box.entity";
import {Repository} from "typeorm";
import {AppLogger} from "@common/logger/app-logger.service";
import {BoxTemplate} from "@box-template/entities/box-template.entity";

@Injectable()
export class BoxTemplateRepository {
  constructor(
    @InjectRepository(BoxTemplate)
    private readonly boxTemplateRepository: Repository<BoxTemplate>,
    private readonly logger: AppLogger,
  ) {}

  async findById(id: number): Promise<BoxTemplate | null> {
    this.logger.debug(`searching box template with id: ${id}`, BoxTemplateRepository.name)

    const result = await this.boxTemplateRepository.findOne({
      where: {id},
      relations: ['store']
      })

    this.logger.debug('Box template search completed', 'BoxTemplateRepository', {
      id: id, found: !!result })
    return result
  }
}