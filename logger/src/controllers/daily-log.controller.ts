import { Controller, Get, Post, Body, Query, Param } from '@nestjs/common';
import { DailyLogService } from '../services/daily-log.service';
import { LogEntry, LogSearchQuery, DailyLogStats } from '../models/daily-log.interface';

// DTO'lar (Data Transfer Objects)
export class AddLogDto {
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  category?: string;
  source?: string;
  metadata?: Record<string, any>;
  targetDate?: string; // YYYY-MM-DD formatında
}

export class AddMultipleLogsDto {
  logs: Omit<AddLogDto, 'targetDate'>[];
  targetDate?: string;
}

export class CreateContainerDto {
  date?: string; // YYYY-MM-DD formatında, boş bırakılırsa bugün
}

@Controller('daily-logs')
export class DailyLogController {
  constructor(private readonly dailyLogService: DailyLogService) {}

  /**
   * Test Senaryosu 1: Boş Başlangıç - İlk log gelişi
   * POST /daily-logs/add-log
   */
  @Post('add-log')
  async addLog(@Body() addLogDto: AddLogDto): Promise<{
    success: boolean;
    message: string;
    containerCreated: boolean;
    date: string;
    scenario?: string;
  }> {
    console.log(`📝 Adding log: ${addLogDto.level.toUpperCase()} - ${addLogDto.message}`);
    
    const result = await this.dailyLogService.addLogToDaily(
      {
        level: addLogDto.level,
        message: addLogDto.message,
        category: addLogDto.category,
        source: addLogDto.source,
        metadata: addLogDto.metadata || {}
      },
      addLogDto.targetDate
    );

    let scenario = '';
    if (result.containerCreated) {
      scenario = 'İlk log - Günlük container oluşturuldu';
    } else {
      scenario = 'Mevcut container\'a log eklendi';
    }

    return {
      success: result.success,
      message: result.success 
        ? `Log başarıyla eklendi. ${scenario}` 
        : 'Log ekleme başarısız',
      containerCreated: result.containerCreated,
      date: result.date,
      scenario
    };
  }

  /**
   * Test Senaryosu 2-4: Aynı gün içinde birden fazla log
   * POST /daily-logs/add-multiple
   */
  @Post('add-multiple')
  async addMultipleLogs(@Body() addMultipleDto: AddMultipleLogsDto): Promise<{
    success: boolean;
    message: string;
    addedCount: number;
    containerCreated: boolean;
    date: string;
  }> {
    console.log(`📝 Adding ${addMultipleDto.logs.length} logs to daily container`);
    
    const result = await this.dailyLogService.addMultipleLogs(
      addMultipleDto.logs,
      addMultipleDto.targetDate
    );

    return {
      success: result.success,
      message: result.success 
        ? `${result.addedCount} log başarıyla eklendi` 
        : 'Toplu log ekleme başarısız',
      addedCount: result.addedCount,
      containerCreated: result.containerCreated,
      date: result.date
    };
  }

  /**
   * Test Senaryosu 5: Servis/Cron yaklaşımı - Boş container oluşturma
   * POST /daily-logs/ensure-container
   */
  @Post('ensure-container')
  async ensureDailyContainer(@Body() createDto: CreateContainerDto): Promise<{
    exists: boolean;
    created: boolean;
    date: string;
    message: string;
    scenario: string;
  }> {
    const result = await this.dailyLogService.ensureDailyContainer(createDto.date);
    
    let scenario = '';
    if (result.created) {
      scenario = 'Servis/Cron yaklaşımı - Boş container oluşturuldu';
    } else {
      scenario = 'Container zaten mevcut';
    }

    return {
      ...result,
      message: result.created 
        ? `${result.date} için günlük container oluşturuldu`
        : `${result.date} için container zaten mevcut`,
      scenario
    };
  }

  /**
   * Günlük logları görüntüle - bugün için
   * GET /daily-logs
   */
  @Get()
  async getTodayLogs(): Promise<{
    container: any;
    stats: DailyLogStats | null;
    message: string;
  }> {
    const targetDate = new Date().toISOString().split('T')[0];
    console.log(`🔍 Getting daily logs for today: ${targetDate}`);
    
    const container = await this.dailyLogService.getDailyLogs(targetDate);
    const stats = await this.dailyLogService.getDailyStats(targetDate);
    
    return {
      container,
      stats,
      message: container 
        ? `${targetDate} için ${container.logCount || container.logs.length} log bulundu`
        : `${targetDate} için log bulunamadı`
    };
  }

  /**
   * Belirli tarih için günlük logları görüntüle
   * GET /daily-logs/date/:date
   */
  @Get('date/:date')
  async getDailyLogsByDate(@Param('date') date: string): Promise<{
    container: any;
    stats: DailyLogStats | null;
    message: string;
  }> {
    console.log(`🔍 Getting daily logs for: ${date}`);
    
    const container = await this.dailyLogService.getDailyLogs(date);
    const stats = await this.dailyLogService.getDailyStats(date);
    
    return {
      container,
      stats,
      message: container 
        ? `${date} için ${container.logCount || container.logs.length} log bulundu`
        : `${date} için log bulunamadı`
    };
  }

  /**
   * Log arama
   * GET /daily-logs/search?startDate=2025-10-01&endDate=2025-10-03&level=error
   */
  @Get('api/search')
  async searchLogs(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('level') level?: string,
    @Query('category') category?: string,
    @Query('message') message?: string,
    @Query('limit') limit?: string,
    @Query('skip') skip?: string
  ): Promise<{
    logs: LogEntry[];
    totalCount: number;
    containers: any[];
    query: LogSearchQuery;
  }> {
    const query: LogSearchQuery = {
      startDate,
      endDate,
      level,
      category,
      message,
      limit: limit ? parseInt(limit, 10) : undefined,
      skip: skip ? parseInt(skip, 10) : undefined
    };

    console.log('🔍 Searching logs with query:', query);
    
    const result = await this.dailyLogService.searchLogs(query);
    
    return {
      ...result,
      query
    };
  }

  /**
   * Tüm günleri listele
   * GET /daily-logs/api/dates
   */
  @Get('api/dates')
  async getAllDates(): Promise<{
    dates: string[];
    count: number;
  }> {
    const dates = await this.dailyLogService.getAllDates();
    
    return {
      dates,
      count: dates.length
    };
  }

  /**
   * Bugünkü günlük istatistikleri
   * GET /daily-logs/api/stats
   */
  @Get('api/stats')
  async getTodayStats(): Promise<{
    stats: DailyLogStats | null;
    message: string;
  }> {
    const targetDate = new Date().toISOString().split('T')[0];
    const stats = await this.dailyLogService.getDailyStats(targetDate);
    
    return {
      stats,
      message: stats 
        ? `${targetDate} günü için istatistikler`
        : `${targetDate} günü için veri bulunamadı`
    };
  }

  /**
   * Belirli tarih için günlük istatistikleri
   * GET /daily-logs/api/stats/:date
   */
  @Get('api/stats/:date')
  async getDailyStatsByDate(@Param('date') date: string): Promise<{
    stats: DailyLogStats | null;
    message: string;
  }> {
    const stats = await this.dailyLogService.getDailyStats(date);
    
    return {
      stats,
      message: stats 
        ? `${date} günü için istatistikler`
        : `${date} günü için veri bulunamadı`
    };
  }

  /**
   * MongoDB bağlantısını test et
   * GET /daily-logs/api/test-connection
   */
  @Get('api/test-connection')
  async testConnection(): Promise<{
    connected: boolean;
    message: string;
    details: any;
  }> {
    try {
      const connected = await this.dailyLogService.connectMongo();
      return {
        connected,
        message: connected ? 'MongoDB bağlantısı başarılı' : 'MongoDB bağlantısı başarısız',
        details: {
          timestamp: new Date().toISOString(),
          url: 'mongodb://127.0.0.1:27017/daily_logs_test'
        }
      };
    } catch (error) {
      return {
        connected: false,
        message: 'MongoDB bağlantı hatası',
        details: {
          error: error.message,
          timestamp: new Date().toISOString()
        }
      };
    }
  }

  /**
   * Test koleksiyonunu temizle
   * POST /daily-logs/api/clear
   */
  @Post('api/clear')
  async clearAllLogs(): Promise<{
    deletedCount: number;
    message: string;
  }> {
    console.log('🧹 Clearing all daily log containers...');
    const result = await this.dailyLogService.clearAllLogs();
    
    return {
      deletedCount: result.deletedCount,
      message: `${result.deletedCount} günlük container temizlendi`
    };
  }

  /**
   * Belirli günün container'ını sil
   * DELETE /daily-logs/:date
   */
  @Post('api/delete/:date')
  async deleteDailyContainer(@Param('date') date: string): Promise<{
    deleted: boolean;
    message: string;
    date: string;
  }> {
    console.log(`🗑️ Deleting daily container for: ${date}`);
    const deleted = await this.dailyLogService.deleteDailyContainer(date);
    
    return {
      deleted,
      date,
      message: deleted 
        ? `${date} günlük container'ı silindi`
        : `${date} günlük container'ı bulunamadı`
    };
  }

  /**
   * Test senaryoları için hızlı log üretimi
   * POST /daily-logs/api/generate-test-data
   */
  @Post('api/generate-test-data')
  async generateTestData(@Body() params?: {
    days?: number;
    logsPerDay?: number;
    startDate?: string;
  }): Promise<{
    success: boolean;
    generatedDays: number;
    totalLogs: number;
    dateRange: { from: string; to: string };
  }> {
    const days = params?.days || 3;
    const logsPerDay = params?.logsPerDay || 10;
    const startDate = params?.startDate || new Date().toISOString().split('T')[0];
    
    console.log(`🧪 Generating test data: ${days} days, ${logsPerDay} logs per day, starting from ${startDate}`);
    
    const categories = ['auth', 'api', 'database', 'system', 'security'];
    const levels: ('info' | 'warn' | 'error' | 'debug')[] = ['info', 'warn', 'error', 'debug'];
    const messages = [
      'System started successfully',
      'User authentication completed',
      'Database connection established', 
      'API request processed',
      'File upload completed',
      'Cache cleared',
      'Backup process started',
      'Security scan completed',
      'Memory usage optimal',
      'Performance metrics collected'
    ];
    
    let totalLogs = 0;
    let generatedDays = 0;
    
    for (let dayOffset = 0; dayOffset < days; dayOffset++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(currentDate.getDate() + dayOffset);
      const dateStr = currentDate.toISOString().split('T')[0];
      
      // Her gün için rastgele loglar oluştur
      const dailyLogs: Omit<LogEntry, 'timestamp'>[] = [];
      
      for (let logIndex = 0; logIndex < logsPerDay; logIndex++) {
        dailyLogs.push({
          level: levels[Math.floor(Math.random() * levels.length)],
          message: messages[Math.floor(Math.random() * messages.length)],
          category: categories[Math.floor(Math.random() * categories.length)],
          source: 'test-generator',
          metadata: {
            dayOffset,
            logIndex,
            testRun: new Date().toISOString(),
            randomValue: Math.random()
          }
        });
      }
      
      const result = await this.dailyLogService.addMultipleLogs(dailyLogs, dateStr);
      
      if (result.success) {
        totalLogs += result.addedCount;
        generatedDays++;
      }
    }
    
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + days - 1);
    
    return {
      success: true,
      generatedDays,
      totalLogs,
      dateRange: {
        from: startDate,
        to: endDate.toISOString().split('T')[0]
      }
    };
  }

  /**
   * Test senaryosu simülasyonu - Tam otomatik test
   * POST /daily-logs/api/simulate-scenario
   */
  @Post('api/simulate-scenario')
  async simulateTestScenario(@Body() params?: {
    scenario?: 'upsert' | 'service-cron' | 'mixed';
  }): Promise<{
    scenario: string;
    steps: any[];
    summary: string;
  }> {
    const scenario = params?.scenario || 'upsert';
    const steps: any[] = [];
    
    console.log(`🎭 Simulating scenario: ${scenario}`);
    
    // Temizlik
    const clearResult = await this.dailyLogService.clearAllLogs();
    steps.push({
      step: 'Cleanup',
      action: 'Collection cleared',
      result: clearResult
    });
    
    if (scenario === 'upsert' || scenario === 'mixed') {
      // Senaryo 1: İlk log gelişi (boş başlangıç)
      const firstLogResult = await this.dailyLogService.addLogToDaily({
        level: 'info',
        message: 'System started - First log of the day',
        category: 'system',
        source: 'scenario-test'
      });
      steps.push({
        step: 'First Log (Upsert Test)',
        action: 'Add first log to empty system',
        result: firstLogResult,
        expected: 'Should create new daily container'
      });
      
      // Senaryo 2: Aynı gün ikinci log
      const secondLogResult = await this.dailyLogService.addLogToDaily({
        level: 'error',
        message: 'Database connection failed - Second log',
        category: 'database',
        source: 'scenario-test'
      });
      steps.push({
        step: 'Second Log (Same Day)',
        action: 'Add second log to existing container',
        result: secondLogResult,
        expected: 'Should NOT create new container, should append to existing'
      });
      
      // Senaryo 3: Aynı güne birden fazla log (farklı client simülasyonu)
      const multipleLogsResult = await this.dailyLogService.addMultipleLogs([
        {
          level: 'info',
          message: 'User authentication successful',
          category: 'auth',
          source: 'client-1'
        },
        {
          level: 'warn',
          message: 'High memory usage detected',
          category: 'system',
          source: 'client-2'
        },
        {
          level: 'debug',
          message: 'API call traced',
          category: 'api',
          source: 'client-3'
        }
      ]);
      steps.push({
        step: 'Multiple Clients (Same Day)',
        action: 'Multiple logs from different clients',
        result: multipleLogsResult,
        expected: 'Should append all logs to same container'
      });
    }
    
    if (scenario === 'service-cron' || scenario === 'mixed') {
      // Senaryo 4: Servis/Cron yaklaşımı - Ertesi gün boş container
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];
      
      const containerResult = await this.dailyLogService.ensureDailyContainer(tomorrowStr);
      steps.push({
        step: 'Service/Cron Approach',
        action: 'Create empty container for next day',
        result: containerResult,
        expected: 'Should create empty container for future date'
      });
    }
    
    // Senaryo 5: Ertesi güne ilk log
    const nextDay = new Date();
    nextDay.setDate(nextDay.getDate() + 2);
    const nextDayStr = nextDay.toISOString().split('T')[0];
    
    const nextDayLogResult = await this.dailyLogService.addLogToDaily({
      level: 'info',
      message: 'New day started - First log of next day',
      category: 'system',
      source: 'scenario-test'
    }, nextDayStr);
    steps.push({
      step: 'Next Day First Log',
      action: 'Add log to new day',
      result: nextDayLogResult,
      expected: 'Should create separate container for new date'
    });
    
    // Senaryo 6: Idempotency testi - aynı log tekrar
    const duplicateResult = await this.dailyLogService.addLogToDaily({
      level: 'info',
      message: 'System started - First log of the day', // Aynı mesaj
      category: 'system',
      source: 'scenario-test'
    });
    steps.push({
      step: 'Idempotency Test',
      action: 'Add same log again (should not create duplicate container)',
      result: duplicateResult,
      expected: 'Should append to existing container, no duplicate containers'
    });
    
    // Özet istatistikleri
    const allDates = await this.dailyLogService.getAllDates();
    const summaryStats: DailyLogStats[] = [];
    
    for (const date of allDates) {
      const stats = await this.dailyLogService.getDailyStats(date);
      if (stats) {
        summaryStats.push(stats);
      }
    }
    
    steps.push({
      step: 'Final Summary',
      action: 'Collect all statistics',
      result: {
        totalDays: allDates.length,
        dates: allDates,
        stats: summaryStats
      },
      expected: 'Should show daily containers with correct log counts'
    });
    
    const summary = `
📊 ${scenario.toUpperCase()} SCENARIO SIMULATION COMPLETED:
- Total containers created: ${allDates.length}
- Date range: ${allDates.length > 0 ? `${allDates[allDates.length-1]} to ${allDates[0]}` : 'None'}
- Total steps executed: ${steps.length}
- All upsert operations should maintain single container per day
- No duplicate containers should exist for same date
    `;
    
    return {
      scenario,
      steps,
      summary
    };
  }
}