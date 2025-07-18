import { Module } from '@nestjs/common';
import {TypeOrmModule} from "@nestjs/typeorm";
import {Customer} from "./entities/customer.entity";
import {CustomerRepository} from "./repositories/customer.repository";

@Module({
    imports: [TypeOrmModule.forFeature([Customer])],
    controllers: [],
    providers: [CustomerRepository],
    exports: [CustomerRepository],
})
export class CustomerModule {}
