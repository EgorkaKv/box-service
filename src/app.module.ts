import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import {ConfigModule, ConfigService} from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { CustomerModule } from './customer/customer.module';
import { StoreModule } from './store/store.module';
import { SurpriseBoxModule } from './surprise-box/surprise-box.module';
import { OrderModule } from './order/order.module';
import { ReviewModule } from './review/review.module';
import { CustomerReportModule } from './customer-report/customer-report.module';
import { BoxTemplateModule } from './box-template/box-template.module';
import { CategoryModule } from './category/category.module';

@Module({
  imports: [
      ConfigModule.forRoot({isGlobal: true}),
      TypeOrmModule.forRootAsync({
          imports: [ConfigModule],
          useFactory: (config: ConfigService) => ({
              type: 'postgres',
              host: config.get('DATABASE_HOST'),
              port: Number(config.get('DATABASE_PORT')),
              username: config.get('DATABASE_USER'),
              password: config.get('DATABASE_PASSWORD'),
              database: config.get('DATABASE_NAME'),
              autoLoadEntities: true,
              synchronize: true, // В продакшене ставь false и используй миграции!
          }),
          inject: [ConfigService],
      }),
      AuthModule,
      CustomerModule,
      StoreModule,
      SurpriseBoxModule,
      OrderModule, ReviewModule, CustomerReportModule, BoxTemplateModule, CategoryModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
