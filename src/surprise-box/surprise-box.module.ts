import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SurpriseBox } from './entities/surprise-box.entity';
import { SurpriseBoxController } from './controllers/surprise-box.controller';
import { SurpriseBoxService } from './services/surprise-box.service';
import { SurpriseBoxRepository } from './repositories/surprise-box.repository';
import {PaginationService} from "@common/pagination/pagination.service";

@Module({
  imports: [TypeOrmModule.forFeature([SurpriseBox])],
  controllers: [SurpriseBoxController],
  providers: [SurpriseBoxService, SurpriseBoxRepository, PaginationService],
  exports: [SurpriseBoxService, SurpriseBoxRepository],
})
export class SurpriseBoxModule {}
