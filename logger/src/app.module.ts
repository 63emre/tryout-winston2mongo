import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { StressTestController } from './stress-test/stress-test.controller';
import { StressTestService } from './stress-test/stress-test.service';
import { DailyLogController } from './controllers/daily-log.controller';
import { DailyLogService } from './services/daily-log.service';

@Module({
  imports: [],
  controllers: [AppController, StressTestController, DailyLogController],
  providers: [AppService, StressTestService, DailyLogService],
})
export class AppModule {}
