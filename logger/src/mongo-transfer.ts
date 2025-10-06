import { DailyLogService } from './services/daily-log.service';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

/**
 * MongoDB ile daily log transfer örneği
 * 
 * Bu script günlük log container sistemini test etmek için kullanılabilir.
 * MongoDB'nin çalıştığından emin olun: mongodb://localhost:27017/daily_logs_test
 */

async function transferLogsToMongo() {
  const app = await NestFactory.create(AppModule);
  const dailyLogService = app.get(DailyLogService);

  console.log('🍃 Daily Log MongoDB transport etkinleştiriliyor...');
  
  console.log('📝 Günlük log container\'lar oluşturuluyor...');
  
  // Test logları üret - günlük container sistemine
  await dailyLogService.addLogToDaily({
    level: 'info',
    message: 'System startup completed',
    category: 'system',
    source: 'mongo-transfer-script'
  });
  
  await dailyLogService.addLogToDaily({
    level: 'info', 
    message: 'Database connections established',
    category: 'database',
    source: 'mongo-transfer-script'
  });
  
  await dailyLogService.addLogToDaily({
    level: 'warn',
    message: 'Memory usage above threshold',
    category: 'system',
    source: 'mongo-transfer-script'
  });
  
  console.log('✅ Günlük loglar başarıyla MongoDB\'ye aktarıldı!');
  console.log('💡 MongoDB koleksiyonu: daily_logs');
  console.log('💡 Test endpoints: /daily-logs/*');

  await app.close();
}

// Eğer script direkt çalıştırılırsa
if (require.main === module) {
  transferLogsToMongo().catch(console.error);
}

export { transferLogsToMongo };