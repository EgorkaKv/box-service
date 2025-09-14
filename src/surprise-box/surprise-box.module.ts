import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SurpriseBox } from './entities/surprise-box.entity';

// Controllers
import { SurpriseBoxController } from './controllers/surprise-box.controller';
import { StoreSurpriseBoxController } from './controllers/store-surprise-box.controller';

// Core Services
import { SurpriseBoxService } from './services/surprise-box.service';
import { CustomerSurpriseBoxService } from './services/customer-surprise-box.service';
import { EmployeeSurpriseBoxService } from './services/employee-surprise-box.service';
import { SurpriseBoxQueryBuilderService } from "@surprise-box/services/surprise-box-query-builder.service";
import { SurpriseBoxSearchService } from "@surprise-box/services/surprise-box-search.service";

// Repository
import { SurpriseBoxRepository } from './repositories/surprise-box.repository';

// Strategy Pattern
import { SearchStrategyFactory } from './strategies/search-strategy.factory';
import {
  NearbySearchStrategy,
  StoreSearchStrategy,
  CitySearchStrategy,
  EmployeeSearchStrategy
} from './strategies/search-strategies';

// External Dependencies
import { PaginationService } from "@common/pagination/pagination.service";
import { BoxTemplateModule } from "@box-template/box-template.module";




@Module({
  imports: [
    TypeOrmModule.forFeature([SurpriseBox]),
    BoxTemplateModule
  ],

  controllers: [
    SurpriseBoxController,
    StoreSurpriseBoxController
  ],

  providers: [
    // Core Business Services
    {
      provide: 'CORE_SERVICES',
      useFactory: () => ({
        surpriseBoxService: SurpriseBoxService,
        customerService: CustomerSurpriseBoxService,
        employeeService: EmployeeSurpriseBoxService,
        queryBuilderService: SurpriseBoxQueryBuilderService,
        searchService: SurpriseBoxSearchService,
      }),
    },
    SurpriseBoxService,
    CustomerSurpriseBoxService,
    EmployeeSurpriseBoxService,
    SurpriseBoxQueryBuilderService,
    SurpriseBoxSearchService,

    // Data Access Layer
    {
      provide: 'DATA_ACCESS',
      useClass: SurpriseBoxRepository,
    },
    SurpriseBoxRepository,

    // Strategy Pattern Implementation
    {
      provide: 'SEARCH_STRATEGIES',
      useFactory: (
        nearby: NearbySearchStrategy,
        store: StoreSearchStrategy,
        city: CitySearchStrategy,
        employee: EmployeeSearchStrategy,
      ) => ({
        nearby,
        store,
        city,
        employee,
      }),
      inject: [
        NearbySearchStrategy,
        StoreSearchStrategy,
        CitySearchStrategy,
        EmployeeSearchStrategy,
      ],
    },
    SearchStrategyFactory,
    NearbySearchStrategy,
    StoreSearchStrategy,
    CitySearchStrategy,
    EmployeeSearchStrategy,

    // External Services
    PaginationService,
  ],

  exports: [
    // Экспортируем только необходимые сервисы
    SurpriseBoxService,
    CustomerSurpriseBoxService,
    EmployeeSurpriseBoxService,
    SurpriseBoxRepository,
  ],
})
export class SurpriseBoxModule {}
