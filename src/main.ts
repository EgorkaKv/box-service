import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { AppLogger } from '@common/logger/app-logger.service';
import { GlobalExceptionFilter } from '@common/filters/global-exception.filter';
import { LoggingInterceptor } from '@common/interceptors/logging.interceptor';

// Функция для проверки критически важных переменных среды
function validateCriticalEnvVars() {
  const requiredVars = [
    'DATABASE_HOST',
    'DATABASE_PORT',
    'DATABASE_USER',
    'DATABASE_PASSWORD',
    'DATABASE_NAME',
    'JWT_SECRET'
  ];

  const missingVars = requiredVars.filter(varName => !process.env[varName]);

  if (missingVars.length > 0) {
    console.error('❌ Critical environment variables are missing:');
    missingVars.forEach(varName => {
      console.error(`   - ${varName}`);
    });
    console.error('\n💡 Please check your .env file or environment configuration');
    process.exit(1);
  }
}

async function bootstrap() {
  try {
    // Проверяем критически важные переменные среды перед стартом
    validateCriticalEnvVars();

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
      // .addTag('Customers', 'Customer management endpoints')
      // .addTag('Stores', 'Store management endpoints')
      // .addTag('Categories', 'Category management endpoints')
      // .addTag('Box Templates', 'Box template management endpoints')
      .addTag('Surprise Boxes', 'Surprise box management endpoints')
      // .addTag('Reviews', 'Review management endpoints')
      // .addTag('Reports', 'Customer report endpoints')
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

    // Cloud Run автоматически устанавливает PORT=8080
    const port = parseInt(process.env.PORT!, 10);
    if (isNaN(port)) {throw new Error('❌ PORT environment variable is not set or is not a number');}

    await app.listen(port, '0.0.0.0');

    const logLevel = process.env.LOG_LEVEL || 'info';
    const environment = process.env.NODE_ENV || 'DEV';

    appLogger.log(`🚀 Application is running on: http://0.0.0.0:${port}`, 'Bootstrap');
    appLogger.log(`📚 Swagger documentation: http://0.0.0.0:${port}/api/docs`, 'Bootstrap');
    appLogger.log(`🌍 Environment: ${environment}`, 'Bootstrap');
    appLogger.log(`📊 Log Level: ${logLevel}`, 'Bootstrap');
    appLogger.log(`🔧 Container ready to serve traffic on port ${port}`, 'Bootstrap');
  } catch (error) {
    console.error('❌ Application failed to start:', error.message);
    process.exit(1);
  }
}

bootstrap().catch((error) => {
  console.error('❌ Application failed to start:', error);
  process.exit(1);
});
