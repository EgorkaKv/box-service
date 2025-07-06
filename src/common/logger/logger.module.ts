import { Module, Global } from '@nestjs/common';
import { WinstonModule } from 'nest-winston';
import { WinstonConfigService } from './winston.config';
import { AppLogger } from './app-logger.service';

@Global()
@Module({
  imports: [
    WinstonModule.forRootAsync({
      useFactory: () => WinstonConfigService.createWinstonConfig(),
    }),
  ],
  providers: [AppLogger],
  exports: [AppLogger, WinstonModule],
})
export class LoggerModule {}
