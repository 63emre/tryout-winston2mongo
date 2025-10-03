import { Controller, Get, Query } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('generate-logs')
  async generateDummyLogs(): Promise<string> {
    return await this.appService.generateAllDummyLogs();
  }

  @Get('enable-mongodb')
  enableMongoDB(@Query('url') mongoUrl?: string): string {
    return this.appService.enableMongoDB(mongoUrl);
  }
}
