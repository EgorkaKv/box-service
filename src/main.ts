import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { AppModule } from './app.module';
import { AppLogger } from '@common/logger/app-logger.service';
import { GlobalExceptionFilter } from '@common/filters/global-exception.filter';
import { LoggingInterceptor } from '@common/interceptors/logging.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  // Получаем наш кастомный логгер
  const appLogger = app.get(AppLogger);

  // Устанавливаем кастомный логгер как основной
  app.useLogger(appLogger);

  // Настройка Swagger документации
  const config = new DocumentBuilder()
    .setTitle('Box Service API')
    .setDescription('API documentation for Box Service application')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('Store Authentication', 'Employee authentication endpoints')
    .addTag('Customer Authentication', 'Customer authentication endpoints')
    .addTag('Orders', 'Order management endpoints')
    .addTag('Customers', 'Customer management endpoints')
    .addTag('Stores', 'Store management endpoints')
    .addTag('Categories', 'Category management endpoints')
    .addTag('Box Templates', 'Box template management endpoints')
    .addTag('Surprise Boxes', 'Surprise box management endpoints')
    .addTag('Reviews', 'Review management endpoints')
    .addTag('Reports', 'Customer report endpoints')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      docExpansion: 'none',
      filter: true,
      showRequestDuration: true,
    },
  });

  // Регистрируем глобальные фильтры и интерцепторы
  app.useGlobalFilters(new GlobalExceptionFilter(appLogger));
  app.useGlobalInterceptors(new LoggingInterceptor(appLogger));

  const port = process.env.PORT || 3000;

  await app.listen(port);

  const logLevel = process.env.LOG_LEVEL || 'info';
  const environment = process.env.NODE_ENV || 'DEV';

  appLogger.log(`🚀 Application is running on: http://localhost:${port}`, 'Bootstrap');
  appLogger.log(`📚 Swagger documentation: http://localhost:${port}/api/docs`, 'Bootstrap');
  appLogger.log(`🌍 Environment: ${environment}`, 'Bootstrap');
  appLogger.log(`📊 Log Level: ${logLevel}`, 'Bootstrap');
}

bootstrap().catch((error) => {
  console.error('❌ Application failed to start:', error);
  process.exit(1);
});
