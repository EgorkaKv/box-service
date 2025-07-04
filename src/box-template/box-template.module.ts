import { Module } from '@nestjs/common';
import {TypeOrmModule} from "@nestjs/typeorm";
import {BoxTemplate} from "./entities/box-template.entity";

@Module({
    imports: [TypeOrmModule.forFeature([BoxTemplate])],
})
export class BoxTemplateModule {}
