import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from './entities/order.entity';
import { Payment } from './entities/payment.entity';
import { Delivery } from './entities/delivery.entity';
import { SurpriseBox } from '@surprise-box/entities/surprise-box.entity';
import { OrderController } from './controllers/order.controller';
import { StoreOrderController } from './controllers/store-order.controller';
import { OrderService } from './services/order.service';
import { EmployeeOrderService } from './services/employee-order.service';
import { OrderErrorHandlerService } from './services/order-error-handler.service';
import { OrderRepository } from './repositories/order.repository';
import { PaginationService } from '@common/pagination/pagination.service';
import { OrderMapper } from '@order/mappers';
import { SurpriseBoxMapper } from '@order/mappers';
import { StoreMapper } from '@order/mappers';
import { PaymentMapper } from '@order/mappers';
import { LoggerModule } from '@common/logger/logger.module';
import {SurpriseBoxModule} from "@surprise-box/surprise-box.module";
import { OrderOwnershipGuard, StoreOrderOwnershipGuard } from './guards/order-ownership.guard';
import {OrderSearchService} from "@order/services/order-search.service";

@Module({
    imports: [
        TypeOrmModule.forFeature([Order, Payment, Delivery, SurpriseBox]),
        LoggerModule,
        SurpriseBoxModule,
    ],
    controllers: [OrderController, StoreOrderController],
    providers: [
        // Основные сервисы
        OrderService,
        EmployeeOrderService,
        OrderSearchService,
        OrderErrorHandlerService,

        // Репозитории
        OrderRepository,

        // Утилиты
        PaginationService,

        // Мапперы
        OrderMapper,
        SurpriseBoxMapper,
        StoreMapper,
        PaymentMapper,

        // Guard'ы
        OrderOwnershipGuard,
        StoreOrderOwnershipGuard
    ],
    exports: [
        OrderService,
        OrderRepository,
        PaginationService,
        OrderMapper,
        SurpriseBoxMapper,
        StoreMapper,
        PaymentMapper
    ],
})
export class OrderModule {}
