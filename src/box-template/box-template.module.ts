import { Module } from '@nestjs/common';
import {TypeOrmModule} from "@nestjs/typeorm";
import {BoxTemplate} from "./box-template.entity";

@Module({
    imports: [TypeOrmModule.forFeature([BoxTemplate])],
})
export class BoxTemplateModule {}
