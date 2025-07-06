import { NestFactory } from '@nestjs/core';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { AppModule } from './app.module';
import { AppLogger } from './common/logger/app-logger.service';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  // Получаем наш кастомный логгер
  const appLogger = app.get(AppLogger);

  // Устанавливаем кастомный логгер как основной
  app.useLogger(appLogger);

  // Регистрируем глобальные фильтры и интерцепторы
  app.useGlobalFilters(new GlobalExceptionFilter(appLogger));
  app.useGlobalInterceptors(new LoggingInterceptor(appLogger));

  const port = process.env.PORT || 3000;

  await app.listen(port);

  const logLevel = process.env.LOG_LEVEL || 'info';
  const environment = process.env.NODE_ENV || 'DEV';

  appLogger.log(`🚀 Application is running on: http://localhost:${port}`, 'Bootstrap');
  appLogger.log(`🌍 Environment: ${environment}`, 'Bootstrap');
  appLogger.log(`📊 Log Level: ${logLevel}`, 'Bootstrap');
}

bootstrap().catch((error) => {
  console.error('❌ Application failed to start:', error);
  process.exit(1);
});
