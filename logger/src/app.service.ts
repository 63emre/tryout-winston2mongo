import { Injectable } from '@nestjs/common';
import { DailyLogService } from './services/daily-log.service';

@Injectable()
export class AppService {
  constructor(private readonly dailyLogService: DailyLogService) {}

  getHello(): string {
    // Günlük log sistemi hakkında bilgi
    this.demonstrateDailyLogging();
    return 'Hello World! Daily Log Container System is ready for testing.';
  }

  private async demonstrateDailyLogging(): Promise<void> {
    // Günlük container sistemine örnek loglar ekle
    await this.dailyLogService.addLogToDaily({
      level: 'info',
      message: 'Application started successfully',
      category: 'system',
      source: 'app-service',
      metadata: { version: '1.0.0', environment: 'development' }
    });

    await this.dailyLogService.addLogToDaily({
      level: 'info',
      message: 'User authentication system initialized',
      category: 'auth',
      source: 'app-service',
      metadata: { provider: 'jwt', timeout: 3600 }
    });

    await this.dailyLogService.addLogToDaily({
      level: 'info',
      message: 'Database connection pool created',
      category: 'database',
      source: 'app-service',
      metadata: { poolSize: 10, maxConnections: 50 }
    });
  }

  // Daily log sistem bilgisi
  async getDailyLogSystemInfo(): Promise<string> {
    const dates = await this.dailyLogService.getAllDates();
    const today = new Date().toISOString().split('T')[0];
    const todayStats = await this.dailyLogService.getDailyStats(today);
    
    return `Daily Log System Info:
- Total days with logs: ${dates.length}
- Today's logs: ${todayStats?.totalLogs || 0}
- Available endpoints: /daily-logs/* for testing
- MongoDB collection: daily_logs`;
  }

  // Test verisi oluştur
  async generateTestData(): Promise<string> {
    try {
      const categories = ['auth', 'api', 'database', 'system', 'security'];
      const levels: ('info' | 'warn' | 'error' | 'debug')[] = ['info', 'warn', 'error', 'debug'];
      
      // Bugün için 10 test log'u ekle
      const testLogs = Array.from({ length: 10 }, (_, index) => ({
        level: levels[Math.floor(Math.random() * levels.length)],
        message: `Test log entry ${index + 1} - ${categories[Math.floor(Math.random() * categories.length)]}`,
        category: categories[Math.floor(Math.random() * categories.length)],
        source: 'app-service-test',
        metadata: {
          testIndex: index,
          timestamp: new Date().toISOString(),
          randomValue: Math.random()
        }
      }));
      
      const result = await this.dailyLogService.addMultipleLogs(testLogs);
      
      return `Test data generated successfully! Added ${result.addedCount} logs to daily container.`;
    } catch (error) {
      return `Error generating test data: ${error.message}`;
    }
  }

  // Daily log sistemi durumunu kontrol et
  async checkDailyLogStatus(): Promise<string> {
    const dates = await this.dailyLogService.getAllDates();
    let status = `Daily Log System Status:\n`;
    status += `- Total containers: ${dates.length}\n`;
    
    if (dates.length > 0) {
      status += `- Date range: ${dates[dates.length-1]} to ${dates[0]}\n`;
      
      // Son 3 günün istatistikleri
      for (let i = 0; i < Math.min(3, dates.length); i++) {
        const stats = await this.dailyLogService.getDailyStats(dates[i]);
        if (stats) {
          status += `- ${dates[i]}: ${stats.totalLogs} logs (${stats.levelCounts.error} errors, ${stats.levelCounts.warn} warnings)\n`;
        }
      }
    } else {
      status += `- No log containers found\n`;
      status += `- Use /daily-logs/add-log endpoint to start logging\n`;
    }
    
    return status;
  }
}
