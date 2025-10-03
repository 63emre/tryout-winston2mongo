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

  // API kategorisi logları
  logAPI(level: 'info' | 'warn' | 'error' | 'debug', data: LogData) {
    const logger = WinstonLogger.getLogger(LogCategory.API);
    logger.log(level, data.message, {
      userId: data.userId,
      action: data.action,
      ...data.metadata
    });
  }

  // Database kategorisi logları
  logDatabase(level: 'info' | 'warn' | 'error' | 'debug', data: LogData) {
    const logger = WinstonLogger.getLogger(LogCategory.DATABASE);
    logger.log(level, data.message, {
      userId: data.userId,
      action: data.action,
      ...data.metadata
    });
  }

  // Security kategorisi logları
  logSecurity(level: 'info' | 'warn' | 'error' | 'debug', data: LogData) {
    const logger = WinstonLogger.getLogger(LogCategory.SECURITY);
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

  async generateAPILogs(count: number = 50): Promise<void> {
    const actions = ['get_request', 'post_request', 'put_request', 'delete_request', 'rate_limit_exceeded', 'api_error'];
    const endpoints = ['/api/users', '/api/products', '/api/orders', '/api/auth', '/api/files'];
    const levels: ('info' | 'warn' | 'error')[] = ['info', 'warn', 'error'];

    for (let i = 0; i < count; i++) {
      const action = actions[Math.floor(Math.random() * actions.length)];
      const endpoint = endpoints[Math.floor(Math.random() * endpoints.length)];
      const level = action.includes('error') || action.includes('exceeded') ? 'error' : levels[Math.floor(Math.random() * levels.length)];

      this.logAPI(level, {
        message: `API: ${action} on ${endpoint}`,
        action,
        metadata: {
          endpoint,
          method: action.split('_')[0].toUpperCase(),
          responseTime: Math.floor(Math.random() * 2000),
          statusCode: level === 'error' ? 500 : 200
        }
      });
    }
  }

  async generateDatabaseLogs(count: number = 50): Promise<void> {
    const actions = ['select_query', 'insert_query', 'update_query', 'delete_query', 'connection_error', 'slow_query'];
    const tables = ['users', 'products', 'orders', 'logs', 'sessions'];
    const levels: ('info' | 'warn' | 'error')[] = ['info', 'warn', 'error'];

    for (let i = 0; i < count; i++) {
      const action = actions[Math.floor(Math.random() * actions.length)];
      const table = tables[Math.floor(Math.random() * tables.length)];
      const level = action.includes('error') || action.includes('slow') ? 'error' : levels[Math.floor(Math.random() * levels.length)];

      this.logDatabase(level, {
        message: `DATABASE: ${action} on table ${table}`,
        action,
        metadata: {
          table,
          queryTime: Math.floor(Math.random() * 5000),
          affectedRows: Math.floor(Math.random() * 100),
          database: 'main_db'
        }
      });
    }
  }

  async generateSecurityLogs(count: number = 50): Promise<void> {
    const actions = ['login_attempt', 'failed_login', 'brute_force_detected', 'suspicious_activity', 'firewall_block', 'permission_check'];
    const levels: ('info' | 'warn' | 'error')[] = ['info', 'warn', 'error'];

    for (let i = 0; i < count; i++) {
      const action = actions[Math.floor(Math.random() * actions.length)];
      const level = action.includes('failed') || action.includes('brute') || action.includes('suspicious') || action.includes('block') ? 'error' : levels[Math.floor(Math.random() * levels.length)];

      this.logSecurity(level, {
        message: `SECURITY: ${action}`,
        action,
        metadata: {
          ipAddress: `192.168.1.${Math.floor(Math.random() * 255)}`,
          userAgent: 'Mozilla/5.0 Test Browser',
          threatLevel: level === 'error' ? 'HIGH' : 'LOW',
          sourceCountry: 'TR'
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