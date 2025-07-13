import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from './entities/order.entity';
import { Payment } from './entities/payment.entity';
import { Delivery } from './entities/delivery.entity';
import { SurpriseBox } from '@surprise-box/entities/surprise-box.entity';
import { OrderController } from './controllers/order.controller';
import { OrderService } from './services/order.service';
import { OrderRepository } from './repositories/order.repository';
import { PaginationService } from '../common/pagination/pagination.service';
import { OrderMapper } from './entities/order.mapper';
import { LoggerModule } from '../common/logger/logger.module';
import {SurpriseBoxService} from "@surprise-box/services/surprise-box.service";
import {SurpriseBoxModule} from "@surprise-box/surprise-box.module";

@Module({
    imports: [
        TypeOrmModule.forFeature([Order, Payment, Delivery, SurpriseBox]),
        LoggerModule,
        SurpriseBoxModule,
    ],
    controllers: [OrderController],
    providers: [OrderService, OrderRepository, PaginationService, OrderMapper],
    exports: [OrderService, OrderRepository, PaginationService],
})
export class OrderModule {}
