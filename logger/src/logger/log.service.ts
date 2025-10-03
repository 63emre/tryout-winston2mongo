import { Injectable } from '@nestjs/common';
import { WinstonLogger, LogCategory } from './winston.config';

export interface LogData {
  message: string;
  userId?: string;
  action?: string;
  metadata?: Record<string, any>;
}

@Injectable()
export class LogService {
  
  // Auth kategorisi logları
  logAuth(level: 'info' | 'warn' | 'error' | 'debug', data: LogData) {
    const logger = WinstonLogger.getLogger(LogCategory.AUTH);
    logger.log(level, data.message, {
      userId: data.userId,
      action: data.action,
      ...data.metadata
    });
  }

  // Cloud kategorisi logları
  logCloud(level: 'info' | 'warn' | 'error' | 'debug', data: LogData) {
    const logger = WinstonLogger.getLogger(LogCategory.CLOUD);
    logger.log(level, data.message, {
      userId: data.userId,
      action: data.action,
      ...data.metadata
    });
  }

  // Microphone kategorisi logları
  logMicrophone(level: 'info' | 'warn' | 'error' | 'debug', data: LogData) {
    const logger = WinstonLogger.getLogger(LogCategory.MIC);
    logger.log(level, data.message, {
      userId: data.userId,
      action: data.action,
      ...data.metadata
    });
  }

  // System kategorisi logları
  logSystem(level: 'info' | 'warn' | 'error' | 'debug', data: LogData) {
    const logger = WinstonLogger.getLogger(LogCategory.SYSTEM);
    logger.log(level, data.message, {
      userId: data.userId,
      action: data.action,
      ...data.metadata
    });
  }

  // User kategorisi logları
  logUser(level: 'info' | 'warn' | 'error' | 'debug', data: LogData) {
    const logger = WinstonLogger.getLogger(LogCategory.USER);
    logger.log(level, data.message, {
      userId: data.userId,
      action: data.action,
      ...data.metadata
    });
  }

  // Genel log metodu - kategori parametreli
  log(category: LogCategory, level: 'info' | 'warn' | 'error' | 'debug', data: LogData) {
    const logger = WinstonLogger.getLogger(category);
    logger.log(level, data.message, {
      userId: data.userId,
      action: data.action,
      ...data.metadata
    });
  }

  // Dummy log generator - stres testi için
  async generateDummyLogs(count: number = 100, categories: LogCategory[] = Object.values(LogCategory)): Promise<void> {
    const logLevels: ('info' | 'warn' | 'error' | 'debug')[] = ['info', 'warn', 'error', 'debug'];
    const actions = ['login', 'logout', 'create', 'read', 'update', 'delete', 'upload', 'download', 'connect', 'disconnect'];
    const userIds = ['user_001', 'user_002', 'user_003', 'admin_001', 'system_user'];

    console.log(`Generating ${count} dummy logs across ${categories.length} categories...`);

    for (let i = 0; i < count; i++) {
      const category = categories[Math.floor(Math.random() * categories.length)];
      const level = logLevels[Math.floor(Math.random() * logLevels.length)];
      const action = actions[Math.floor(Math.random() * actions.length)];
      const userId = userIds[Math.floor(Math.random() * userIds.length)];

      const dummyData: LogData = {
        message: `${category.toUpperCase()}: ${action} action performed by ${userId} - Log #${i + 1}`,
        userId: userId,
        action: action,
        metadata: {
          logIndex: i + 1,
          timestamp: new Date().toISOString(),
          randomData: Math.random().toString(36).substring(7),
          sessionId: `session_${Math.floor(Math.random() * 1000)}`,
          ipAddress: `192.168.1.${Math.floor(Math.random() * 255)}`,
          userAgent: 'Test-Agent/1.0'
        }
      };

      this.log(category, level, dummyData);

      // Biraz gecikme ekle ki timestamp'lar farklı olsun
      if (i % 10 === 0) {
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    }

    console.log(`Successfully generated ${count} dummy logs!`);
  }

  // Kategoriye özel dummy loglar
  async generateAuthLogs(count: number = 50): Promise<void> {
    const actions = ['login', 'logout', 'password_reset', 'account_created', 'permission_denied', 'token_expired'];
    const userIds = ['user_001', 'user_002', 'admin_001'];

    for (let i = 0; i < count; i++) {
      const action = actions[Math.floor(Math.random() * actions.length)];
      const userId = userIds[Math.floor(Math.random() * userIds.length)];
      const level: 'info' | 'warn' | 'error' = action === 'permission_denied' || action === 'token_expired' ? 'error' : 'info';

      this.logAuth(level, {
        message: `AUTH: ${action} for user ${userId}`,
        userId,
        action,
        metadata: {
          authMethod: 'jwt',
          deviceInfo: 'Test Device',
          location: 'Test Location'
        }
      });
    }
  }

  async generateCloudLogs(count: number = 50): Promise<void> {
    const actions = ['upload', 'download', 'sync', 'backup', 'restore', 'delete_file'];
    const fileTypes = ['document', 'image', 'video', 'audio', 'archive'];

    for (let i = 0; i < count; i++) {
      const action = actions[Math.floor(Math.random() * actions.length)];
      const fileType = fileTypes[Math.floor(Math.random() * fileTypes.length)];

      this.logCloud('info', {
        message: `CLOUD: ${action} ${fileType} file`,
        action,
        metadata: {
          fileType,
          fileSize: Math.floor(Math.random() * 1000000),
          cloudProvider: 'AWS S3'
        }
      });
    }
  }

  async generateMicrophoneLogs(count: number = 50): Promise<void> {
    const actions = ['start_recording', 'stop_recording', 'audio_process', 'noise_detected', 'volume_change'];
    const levels: ('info' | 'warn')[] = ['info', 'warn'];

    for (let i = 0; i < count; i++) {
      const action = actions[Math.floor(Math.random() * actions.length)];
      const level = levels[Math.floor(Math.random() * levels.length)];

      this.logMicrophone(level, {
        message: `MICROPHONE: ${action}`,
        action,
        metadata: {
          audioLevel: Math.floor(Math.random() * 100),
          sampleRate: 44100,
          channels: 2
        }
      });
    }
  }

  // MongoDB bağlantısını etkinleştir
  enableMongoDB(mongoUrl?: string): void {
    WinstonLogger.enableMongoDBForAll(mongoUrl);
    console.log('MongoDB transport enabled for all loggers');
  }
}