import { Module } from '@nestjs/common';
import {TypeOrmModule} from "@nestjs/typeorm";
import {Order} from "./entities/order.entity";
import {Payment} from "./entities/payment.entity";

@Module({
    imports: [TypeOrmModule.forFeature([Order, Payment])],
    controllers: [],
    providers: [],
    exports: [],
})
export class OrderModule {}
