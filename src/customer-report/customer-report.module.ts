import { Module } from '@nestjs/common';
import {CustomerReport} from "./entities/customer-report.entity";
import {TypeOrmModule} from "@nestjs/typeorm";

@Module({
    imports: [TypeOrmModule.forFeature([CustomerReport])],
    controllers: [],
    providers: [],
    exports: [],
})
export class CustomerReportModule {}
