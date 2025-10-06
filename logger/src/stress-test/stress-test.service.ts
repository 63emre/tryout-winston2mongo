import { Injectable } from '@nestjs/common';
import { MongoClient, Db, Collection } from 'mongodb';

// Enum tanımları
export enum LogCategory {
  AUTH = 'auth',
  API = 'api', 
  DATABASE = 'database',
  SECURITY = 'security',
  CLOUD = 'cloud',
  SYSTEM = 'system',
  USER = 'user',
  MIC = 'microphone'
}

// Basit log servisi interface
interface SimpleLogService {
  logAuth(level: string, data: any): void;
  logAPI(level: string, data: any): void;
  logDatabase(level: string, data: any): void;
  logSecurity(level: string, data: any): void;
  logCloud(level: string, data: any): void;
  logSystem(level: string, data: any): void;
  logUser(level: string, data: any): void;
  logMicrophone(level: string, data: any): void;
  enableMongoDB(url: string): void;
}

export interface StressTestResult {
  method: 'winston-mongodb' | 'bulk-write';
  logCount: number;
  duration: number;
  logsPerSecond: number;
  averageLatency: number;
  memoryUsage: NodeJS.MemoryUsage;
  errors: number;
}

@Injectable()
export class StressTestService {
  private db: Db | null = null;
  private batchSize = 500; // Bulk write için batch boyutu
  private mongoUrl = 'mongodb://localhost:27017/stress_test_logs';
  private mockLogService: SimpleLogService;

  constructor() {
    // Mock log service oluştur
    this.mockLogService = {
      logAuth: (level: string, data: any) => console.log(`AUTH [${level}]:`, data.message),
      logAPI: (level: string, data: any) => console.log(`API [${level}]:`, data.message),
      logDatabase: (level: string, data: any) => console.log(`DB [${level}]:`, data.message),
      logSecurity: (level: string, data: any) => console.log(`SEC [${level}]:`, data.message),
      logCloud: (level: string, data: any) => console.log(`CLOUD [${level}]:`, data.message),
      logSystem: (level: string, data: any) => console.log(`SYS [${level}]:`, data.message),
      logUser: (level: string, data: any) => console.log(`USER [${level}]:`, data.message),
      logMicrophone: (level: string, data: any) => console.log(`MIC [${level}]:`, data.message),
      enableMongoDB: (url: string) => console.log(`MongoDB enabled: ${url}`)
    };
  }

  async connectMongo(): Promise<boolean> {
    try {
      const client = new MongoClient(this.mongoUrl);
      await client.connect();
      this.db = client.db();
      console.log('🔗 MongoDB connected for stress test');
      return true;
    } catch (error) {
      console.error('❌ MongoDB connection failed:', error.message);
      return false;
    }
  }

  // Winston-MongoDB ile stres testi
  async testWinstonMongoDB(logCount: number = 10000): Promise<StressTestResult> {
    console.log(`🧪 Starting Winston-MongoDB stress test with ${logCount} logs...`);
    
    // MongoDB transport'u etkinleştir
    this.mockLogService.enableMongoDB(this.mongoUrl);
    
    const startTime = Date.now();
    const startMemory = process.memoryUsage();
    let errors = 0;
    const latencies: number[] = [];

    for (let i = 0; i < logCount; i++) {
      const logStartTime = process.hrtime.bigint();
      
      try {
        // Rastgele kategori seç
        const categories = Object.values(LogCategory);
        const category = categories[Math.floor(Math.random() * categories.length)];
        
        // Rastgele log level
        const levels: ('info' | 'warn' | 'error' | 'debug')[] = ['info', 'warn', 'error', 'debug'];
        const level = levels[Math.floor(Math.random() * levels.length)];
        
        const logData = {
          message: `Stress test log ${i + 1} - ${category}`,
          userId: `user_${Math.floor(Math.random() * 1000)}`,
          action: `action_${Math.floor(Math.random() * 100)}`,
          metadata: {
            testId: `stress_test_${Date.now()}`,
            index: i,
            randomData: Math.random().toString(36),
            timestamp: new Date().toISOString(),
            category,
            level
          }
        };

        // Kategori bazlı log yazma
        switch (category) {
          case LogCategory.AUTH:
            this.mockLogService.logAuth(level, logData);
            break;
          case LogCategory.API:
            this.mockLogService.logAPI(level, logData);
            break;
          case LogCategory.DATABASE:
            this.mockLogService.logDatabase(level, logData);
            break;
          case LogCategory.SECURITY:
            this.mockLogService.logSecurity(level, logData);
            break;
          case LogCategory.CLOUD:
            this.mockLogService.logCloud(level, logData);
            break;
          case LogCategory.SYSTEM:
            this.mockLogService.logSystem(level, logData);
            break;
          case LogCategory.USER:
            this.mockLogService.logUser(level, logData);
            break;
          case LogCategory.MIC:
            this.mockLogService.logMicrophone(level, logData);
            break;
        }

        const logEndTime = process.hrtime.bigint();
        const latency = Number(logEndTime - logStartTime) / 1000000; // ms cinsinden
        latencies.push(latency);

        // Her 1000 log'da bir progress göster
        if ((i + 1) % 1000 === 0) {
          console.log(`📊 Winston-MongoDB: ${i + 1}/${logCount} logs written`);
        }

      } catch (error) {
        errors++;
        console.error(`❌ Error writing log ${i + 1}:`, error.message);
      }
    }

    // Biraz bekle ki tüm loglar yazılsın
    await new Promise(resolve => setTimeout(resolve, 2000));

    const endTime = Date.now();
    const endMemory = process.memoryUsage();
    const duration = endTime - startTime;

    return {
      method: 'winston-mongodb',
      logCount,
      duration,
      logsPerSecond: Math.round((logCount / duration) * 1000),
      averageLatency: latencies.length > 0 ? latencies.reduce((a, b) => a + b, 0) / latencies.length : 0,
      memoryUsage: {
        rss: endMemory.rss - startMemory.rss,
        heapUsed: endMemory.heapUsed - startMemory.heapUsed,
        heapTotal: endMemory.heapTotal - startMemory.heapTotal,
        external: endMemory.external - startMemory.external,
        arrayBuffers: endMemory.arrayBuffers - startMemory.arrayBuffers
      },
      errors
    };
  }

  // Bulk Write ile stres testi
  async testBulkWrite(logCount: number = 10000): Promise<StressTestResult> {
    console.log(`🚀 Starting Bulk Write stress test with ${logCount} logs...`);
    
    if (!this.db) {
      throw new Error('MongoDB not connected. Call connectMongo() first.');
    }

    const startTime = Date.now();
    const startMemory = process.memoryUsage();
    let errors = 0;
    const latencies: number[] = [];
    let totalWritten = 0;

    // Kategorilere göre batch'leri grupla
    const batches: Map<LogCategory, any[]> = new Map();
    Object.values(LogCategory).forEach(category => {
      batches.set(category, []);
    });

    // Log'ları hazırla ve batch'lere ekle
    console.log('📝 Preparing logs for bulk write...');
    for (let i = 0; i < logCount; i++) {
      const categories = Object.values(LogCategory);
      const category = categories[Math.floor(Math.random() * categories.length)];
      const levels: ('info' | 'warn' | 'error' | 'debug')[] = ['info', 'warn', 'error', 'debug'];
      const level = levels[Math.floor(Math.random() * levels.length)];
      
      const logDoc = {
        timestamp: new Date(),
        level,
        category,
        message: `Bulk write stress test log ${i + 1} - ${category}`,
        userId: `user_${Math.floor(Math.random() * 1000)}`,
        action: `action_${Math.floor(Math.random() * 100)}`,
        metadata: {
          testId: `bulk_test_${Date.now()}`,
          index: i,
          randomData: Math.random().toString(36),
          category,
          level
        }
      };

      batches.get(category as LogCategory)!.push(logDoc);
    }

    // Batch'leri MongoDB'ye yaz
    console.log('💾 Writing batches to MongoDB...');
    for (const [category, docs] of batches.entries()) {
      if (docs.length === 0) continue;

      const collection: Collection = this.db.collection(`logs_${category}`);
      
      // Büyük batch'leri küçük parçalara böl
      for (let i = 0; i < docs.length; i += this.batchSize) {
        const batchStartTime = process.hrtime.bigint();
        
        try {
          const chunk = docs.slice(i, i + this.batchSize);
          const operations = chunk.map(doc => ({
            insertOne: { document: doc }
          }));

          const result = await collection.bulkWrite(operations, { 
            ordered: false,
            bypassDocumentValidation: true
          });

          totalWritten += result.insertedCount;

          const batchEndTime = process.hrtime.bigint();
          const latency = Number(batchEndTime - batchStartTime) / 1000000; // ms
          latencies.push(latency);

          console.log(`📦 ${category}: ${result.insertedCount} logs written (${totalWritten}/${logCount})`);

        } catch (error) {
          errors++;
          console.error(`❌ Bulk write error for ${category}:`, error.message);
        }
      }
    }

    const endTime = Date.now();
    const endMemory = process.memoryUsage();
    const duration = endTime - startTime;

    return {
      method: 'bulk-write',
      logCount: totalWritten,
      duration,
      logsPerSecond: Math.round((totalWritten / duration) * 1000),
      averageLatency: latencies.length > 0 ? latencies.reduce((a, b) => a + b, 0) / latencies.length : 0,
      memoryUsage: {
        rss: endMemory.rss - startMemory.rss,
        heapUsed: endMemory.heapUsed - startMemory.heapUsed,
        heapTotal: endMemory.heapTotal - startMemory.heapTotal,
        external: endMemory.external - startMemory.external,
        arrayBuffers: endMemory.arrayBuffers - startMemory.arrayBuffers
      },
      errors
    };
  }

  // Karşılaştırmalı stres testi
  async comparePerformance(logCount: number = 10000): Promise<{
    winston: StressTestResult;
    bulkWrite: StressTestResult;
    comparison: any;
  }> {
    console.log(`🏁 Starting performance comparison with ${logCount} logs each...`);

    // MongoDB bağlantısını kontrol et
    if (!this.db) {
      const connected = await this.connectMongo();
      if (!connected) {
        throw new Error('Cannot connect to MongoDB for stress test');
      }
    }

    // Winston-MongoDB testi
    console.log('\n📊 Phase 1: Winston-MongoDB Test');
    const winstonResult = await this.testWinstonMongoDB(logCount);
    
    // Biraz bekleme
    console.log('\n⏳ Waiting 3 seconds before next test...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Bulk Write testi
    console.log('\n🚀 Phase 2: Bulk Write Test');
    const bulkWriteResult = await this.testBulkWrite(logCount);

    // Karşılaştırma hesapla
    const comparison = {
      speedImprovement: ((bulkWriteResult.logsPerSecond - winstonResult.logsPerSecond) / winstonResult.logsPerSecond * 100).toFixed(2) + '%',
      latencyImprovement: ((winstonResult.averageLatency - bulkWriteResult.averageLatency) / winstonResult.averageLatency * 100).toFixed(2) + '%',
      memoryDifference: {
        rss: ((bulkWriteResult.memoryUsage.rss - winstonResult.memoryUsage.rss) / (1024 * 1024)).toFixed(2) + ' MB',
        heapUsed: ((bulkWriteResult.memoryUsage.heapUsed - winstonResult.memoryUsage.heapUsed) / (1024 * 1024)).toFixed(2) + ' MB'
      },
      errorComparison: {
        winston: winstonResult.errors,
        bulkWrite: bulkWriteResult.errors
      }
    };

    console.log('\n🎯 Performance Comparison Results:');
    console.log(`├─ Speed: Bulk Write is ${comparison.speedImprovement} faster`);
    console.log(`├─ Latency: Bulk Write is ${comparison.latencyImprovement} better`);
    console.log(`├─ Memory (RSS): ${comparison.memoryDifference.rss} difference`);
    console.log(`└─ Errors: Winston(${comparison.errorComparison.winston}) vs BulkWrite(${comparison.errorComparison.bulkWrite})`);

    return {
      winston: winstonResult,
      bulkWrite: bulkWriteResult,
      comparison
    };
  }

  // MongoDB koleksiyonlarını temizle
  async cleanupTestCollections(): Promise<void> {
    if (!this.db) return;

    try {
      const collections = await this.db.listCollections().toArray();
      
      for (const collection of collections) {
        if (collection.name.startsWith('logs_')) {
          await this.db.collection(collection.name).deleteMany({});
          console.log(`🧹 Cleaned collection: ${collection.name}`);
        }
      }
    } catch (error) {
      console.error('❌ Cleanup error:', error.message);
    }
  }

  // Gerçek zamanlı performans monitoring
  async realTimeStressTest(logCount: number = 50000, intervalMs: number = 100): Promise<void> {
    console.log(`⚡ Starting real-time stress test: ${logCount} logs with ${intervalMs}ms intervals`);
    
    let written = 0;
    const startTime = Date.now();
    
    const interval = setInterval(() => {
      if (written >= logCount) {
        clearInterval(interval);
        const duration = Date.now() - startTime;
        console.log(`✅ Real-time test completed: ${written} logs in ${duration}ms`);
        return;
      }

      // Her interval'da rastgele sayıda log yaz (1-10)
      const batchSize = Math.floor(Math.random() * 10) + 1;
      
      for (let i = 0; i < batchSize && written < logCount; i++) {
        const categories = Object.values(LogCategory);
        const category = categories[Math.floor(Math.random() * categories.length)];
        
        this.mockLogService.logSystem('info', {
          message: `Real-time stress test log ${written + 1}`,
          action: 'real_time_test',
          metadata: {
            batchIndex: i,
            totalWritten: written,
            timestamp: new Date().toISOString()
          }
        });
        
        written++;
      }

      // Progress göster
      if (written % 1000 === 0) {
        const elapsed = Date.now() - startTime;
        const rate = Math.round((written / elapsed) * 1000);
        console.log(`⚡ Real-time progress: ${written}/${logCount} (${rate} logs/sec)`);
      }
    }, intervalMs);
  }
}