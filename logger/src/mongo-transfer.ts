import { LogService } from './logger/log.service';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

/**
 * MongoDB ile log transfer örneği
 * 
 * Bu script logs klasöründeki mevcut logları MongoDB'ye aktarmak için kullanılabilir.
 * MongoDB'nin çalıştığından emin olun: mongodb://localhost:27017/logs
 */

async function transferLogsToMongo() {
  const app = await NestFactory.create(AppModule);
  const logService = app.get(LogService);

  console.log('🍃 MongoDB transport etkinleştiriliyor...');
  
  // MongoDB bağlantısını etkinleştir
  logService.enableMongoDB('mongodb://localhost:27017/logs');

  console.log('📝 Yeni loglar MongoDB\'ye yazılacak...');
  
  // Yeni loglar üret - bunlar hem dosyaya hem MongoDB'ye yazılacak
  await logService.generateDummyLogs(100);
  await logService.generateAuthLogs(50);
  await logService.generateCloudLogs(50);
  
  console.log('✅ Loglar başarıyla MongoDB\'ye aktarıldı!');
  console.log('💡 MongoDB koleksiyonları:');
  console.log('   - logs_auth');
  console.log('   - logs_cloud'); 
  console.log('   - logs_microphone');
  console.log('   - logs_system');
  console.log('   - logs_user');

  await app.close();
}

// Eğer script direkt çalıştırılırsa
if (require.main === module) {
  transferLogsToMongo().catch(console.error);
}

export { transferLogsToMongo };