import { Module } from '@nestjs/common';
import {TypeOrmModule} from "@nestjs/typeorm";
import {Business} from "./entities/business.entity";
import {Store} from "./entities/store.entity";
import {StoreCredential} from "./entities/store-credential.entity";

@Module({
    imports: [TypeOrmModule.forFeature([Business, Store, StoreCredential])],
    controllers: [],
    providers: [],
    exports: [],
})
export class StoreModule {}
