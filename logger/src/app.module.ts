import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { LogService } from './logger/log.service';
import { StressTestController } from './stress-test/stress-test.controller';
import { StressTestService } from './stress-test/stress-test.service';

@Module({
  imports: [],
  controllers: [AppController, StressTestController],
  providers: [AppService, LogService, StressTestService],
})
export class AppModule {}
