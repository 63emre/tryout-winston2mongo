import { Injectable } from '@nestjs/common';
import { LogService } from './logger/log.service';

@Injectable()
export class AppService {
  constructor(private readonly logService: LogService) {}

  getHello(): string {
    // 8 farklı kategoriye log örneği
    this.demonstrateAllLogCategories();
    return 'Hello World! Check logs in 8 different folders.';
  }

  private demonstrateAllLogCategories(): void {
    // 1. AUTH kategori log
    this.logService.logAuth('info', {
      message: 'User authentication successful',
      userId: 'user123',
      action: 'login',
      metadata: { method: 'jwt', device: 'mobile' }
    });

    // 2. CLOUD kategori log
    this.logService.logCloud('info', {
      message: 'File uploaded to cloud storage',
      userId: 'user123',
      action: 'upload',
      metadata: { fileName: 'document.pdf', size: 1024000 }
    });

    // 3. MICROPHONE kategori log
    this.logService.logMicrophone('warn', {
      message: 'Audio input level too high',
      action: 'volume_warning',
      metadata: { level: 95, threshold: 80 }
    });

    // 4. SYSTEM kategori log
    this.logService.logSystem('info', {
      message: 'System health check completed',
      action: 'health_check',
      metadata: { cpu: 45, memory: 67, disk: 23 }
    });

    // 5. USER kategori log
    this.logService.logUser('info', {
      message: 'User profile updated',
      userId: 'user123',
      action: 'profile_update',
      metadata: { fields: ['email', 'phone'] }
    });

    // 6. API kategori log
    this.logService.logAPI('info', {
      message: 'API endpoint called successfully',
      action: 'get_request',
      metadata: { endpoint: '/api/users', responseTime: 150, statusCode: 200 }
    });

    // 7. DATABASE kategori log
    this.logService.logDatabase('info', {
      message: 'Database query executed',
      action: 'select_query',
      metadata: { table: 'users', queryTime: 25, affectedRows: 10 }
    });

    // 8. SECURITY kategori log
    this.logService.logSecurity('warn', {
      message: 'Multiple login attempts detected',
      action: 'suspicious_activity',
      metadata: { ipAddress: '192.168.1.100', attempts: 5, timeWindow: '5min' }
    });
  }

  // Tüm kategoriler için dummy loglar üret
  async generateAllDummyLogs(): Promise<string> {
    try {
      await this.logService.generateAuthLogs(20);
      await this.logService.generateCloudLogs(20);
      await this.logService.generateMicrophoneLogs(20);
      await this.logService.generateAPILogs(20);
      await this.logService.generateDatabaseLogs(20);
      await this.logService.generateSecurityLogs(20);
      
      // Mevcut kategoriler için de log üret
      await this.logService.generateDummyLogs(20);
      
      return 'All 8 categories dummy logs generated successfully!';
    } catch (error) {
      return `Error generating logs: ${error.message}`;
    }
  }

  // MongoDB bağlantısını etkinleştir
  enableMongoDB(mongoUrl?: string): string {
    this.logService.enableMongoDB(mongoUrl);
    return 'MongoDB logging enabled for all 8 categories';
  }
}
