import { Controller, Get, Query } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('daily-log-info')
  async getDailyLogSystemInfo(): Promise<string> {
    return await this.appService.getDailyLogSystemInfo();
  }

  @Get('generate-test-data')
  async generateTestData(): Promise<string> {
    return await this.appService.generateTestData();
  }

  @Get('daily-log-status')
  async checkDailyLogStatus(): Promise<string> {
    return await this.appService.checkDailyLogStatus();
  }
}
