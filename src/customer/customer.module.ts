import { Module } from '@nestjs/common';
import {TypeOrmModule} from "@nestjs/typeorm";
import {Customer} from "./customer.entity";

@Module({
    imports: [TypeOrmModule.forFeature([Customer])],
    controllers: [],
    providers: [],
    exports: [],
})
export class CustomerModule {}
