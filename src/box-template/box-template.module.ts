import { Module } from '@nestjs/common';
import {TypeOrmModule} from "@nestjs/typeorm";
import {BoxTemplate} from "./entities/box-template.entity";
import {BoxTemplateRepository} from "@box-template/repositories/box-template.repository";
import {LoggerModule} from "@common/logger/logger.module";

@Module({
    imports: [TypeOrmModule.forFeature([BoxTemplate]), LoggerModule],
    providers: [BoxTemplateRepository],
    exports: [BoxTemplateRepository],
})
export class BoxTemplateModule {}
