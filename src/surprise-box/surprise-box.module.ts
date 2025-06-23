import { Module } from '@nestjs/common';
import {TypeOrmModule} from "@nestjs/typeorm";
import {SurpriseBox} from "./surprise-box.entity";

@Module({
    imports: [TypeOrmModule.forFeature([SurpriseBox])],
    controllers: [],
    providers: [],
    exports: [],
})
export class SurpriseBoxModule {}
