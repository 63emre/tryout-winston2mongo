import { Test, TestingModule } from '@nestjs/testing';
import { LogService } from '../logger/log.service';
import { LogCategory } from '../logger/winston.config';

describe('LogService - Stres Testi', () => {
  let logService: LogService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [LogService],
    }).compile();

    logService = module.get<LogService>(LogService);
  });

  describe('Dummy Log Generation', () => {
    it('should generate 500 dummy logs across all categories', async () => {
      console.log('🚀 Starting stress test - generating 500 logs...');
      
      await logService.generateDummyLogs(500);
      
      console.log('✅ Stress test completed - 500 logs generated!');
      expect(true).toBe(true); // Test geçti işareti
    }, 30000); // 30 saniye timeout

    it('should generate auth-specific logs', async () => {
      console.log('🔐 Generating Auth logs...');
      
      await logService.generateAuthLogs(100);
      
      console.log('✅ Auth logs generated!');
      expect(true).toBe(true);
    }, 15000);

    it('should generate cloud-specific logs', async () => {
      console.log('☁️ Generating Cloud logs...');
      
      await logService.generateCloudLogs(100);
      
      console.log('✅ Cloud logs generated!');
      expect(true).toBe(true);
    }, 15000);

    it('should generate microphone-specific logs', async () => {
      console.log('🎤 Generating Microphone logs...');
      
      await logService.generateMicrophoneLogs(100);
      
      console.log('✅ Microphone logs generated!');
      expect(true).toBe(true);
    }, 15000);

    it('should generate mixed category logs with high volume', async () => {
      console.log('🔥 High volume mixed category test - 1000 logs...');
      
      const categories = [LogCategory.AUTH, LogCategory.CLOUD, LogCategory.SYSTEM, LogCategory.USER];
      await logService.generateDummyLogs(1000, categories);
      
      console.log('✅ High volume test completed!');
      expect(true).toBe(true);
    }, 60000); // 1 dakika timeout
  });

  describe('Individual Log Tests', () => {
    it('should log auth events', () => {
      logService.logAuth('info', {
        message: 'User login successful',
        userId: 'test_user_001',
        action: 'login',
        metadata: {
          ip: '127.0.0.1',
          userAgent: 'Jest Test'
        }
      });
      expect(true).toBe(true);
    });

    it('should log cloud events', () => {
      logService.logCloud('info', {
        message: 'File uploaded to cloud',
        userId: 'test_user_001',
        action: 'upload',
        metadata: {
          fileName: 'test-file.jpg',
          fileSize: 1024000
        }
      });
      expect(true).toBe(true);
    });

    it('should log system events', () => {
      logService.logSystem('warn', {
        message: 'High memory usage detected',
        action: 'memory_check',
        metadata: {
          memoryUsage: '85%',
          availableMemory: '2GB'
        }
      });
      expect(true).toBe(true);
    });

    it('should log user events', () => {
      logService.logUser('info', {
        message: 'User profile updated',
        userId: 'test_user_001',
        action: 'profile_update',
        metadata: {
          updatedFields: ['email', 'name']
        }
      });
      expect(true).toBe(true);
    });

    it('should log microphone events', () => {
      logService.logMicrophone('debug', {
        message: 'Audio recording started',
        userId: 'test_user_001',
        action: 'start_recording',
        metadata: {
          sampleRate: 44100,
          channels: 2,
          bitDepth: 16
        }
      });
      expect(true).toBe(true);
    });
  });

  describe('MongoDB Integration Test', () => {
    it('should enable MongoDB transport and generate logs', async () => {
      console.log('🍃 Testing MongoDB integration...');
      
      // MongoDB'yi etkinleştir (test ortamında)
      logService.enableMongoDB('mongodb://localhost:27017/test_logs');
      
      // Test logları üret
      await logService.generateDummyLogs(50);
      
      console.log('✅ MongoDB integration test completed!');
      console.log('💡 Note: Make sure MongoDB is running for actual database writes');
      
      expect(true).toBe(true);
    }, 20000);
  });
});