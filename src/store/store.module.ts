import { Module } from '@nestjs/common';
import {TypeOrmModule} from "@nestjs/typeorm";
import {Business} from "./entities/business.entity";
import {Store} from "./entities/store.entity";

@Module({
    imports: [TypeOrmModule.forFeature([Business, Store])],
    controllers: [],
    providers: [],
    exports: [],
})
export class StoreModule {}
