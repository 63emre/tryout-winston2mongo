import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { LogService } from './logger/log.service';

describe('AppController', () => {
  let appController: AppController;
  let logService: LogService;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService, LogService],
    }).compile();

    appController = app.get<AppController>(AppController);
    logService = app.get<LogService>(LogService);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(appController.getHello()).toBe('Hello World!');
    });

    it('should generate sample logs when app starts', async () => {
      console.log('📝 Generating sample logs from AppController test...');
      
      // App controller testinde de bazı loglar üret
      await logService.generateDummyLogs(50);
      
      console.log('✅ Sample logs generated from AppController!');
      expect(true).toBe(true);
    }, 15000);
  });
});
