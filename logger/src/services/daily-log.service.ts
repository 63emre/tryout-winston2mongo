import { Injectable } from '@nestjs/common';
import { MongoClient, Db, Collection } from 'mongodb';
import { DailyLogContainer, LogEntry, LogSearchQuery, DailyLogStats } from '../models/daily-log.interface';

@Injectable()
export class DailyLogService {
  private db: Db | null = null;
  private mongoUrl = 'mongodb://127.0.0.1:27017/daily_logs_test';
  private collectionName = 'daily_logs';
  
  constructor() {
    this.connectMongo();
  }

  async connectMongo(): Promise<boolean> {
    try {
      console.log(`🔌 Attempting to connect to MongoDB: ${this.mongoUrl}`);
      const client = new MongoClient(this.mongoUrl, {
        serverSelectionTimeoutMS: 5000,
        connectTimeoutMS: 10000,
      });
      await client.connect();
      console.log('✅ MongoDB client connected, getting database...');
      this.db = client.db();
      console.log('🔗 Daily Log MongoDB connected successfully');
      return true;
    } catch (error) {
      console.error('❌ Daily Log MongoDB connection failed:', error);
      console.error('Full error object:', JSON.stringify(error, null, 2));
      return false;
    }
  }

  private async getCollection(): Promise<Collection<DailyLogContainer>> {
    console.log('🔗 getCollection çağrıldı...');
    console.log('📊 DB durumu:', !!this.db ? 'bağlı' : 'bağlı değil');
    
    if (!this.db) {
      console.log('🔌 Database not connected, attempting to connect...');
      const connected = await this.connectMongo();
      console.log('🔗 Bağlantı sonucu:', connected);
      if (!connected || !this.db) {
        console.error('❌ MongoDB bağlantısı kurulamadı!');
        throw new Error('MongoDB not connected and connection failed.');
      }
    }
    
    console.log('📚 Collection alınıyor:', this.collectionName);
    const collection = this.db.collection<DailyLogContainer>(this.collectionName);
    console.log('✅ Collection başarıyla alındı');
    return collection;
  }

  private getTodayString(): string {
    return new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  }

  private formatDateString(date: Date | string): string {
    if (typeof date === 'string') {
      return date;
    }
    return date.toISOString().split('T')[0];
  }

  /**
   * Günlük container'a log ekle (upsert yaklaşımı)
   */
  async addLogToDaily(logEntry: Omit<LogEntry, 'timestamp'>, targetDate?: string): Promise<{ 
    success: boolean; 
    containerCreated: boolean;
    date: string;
  }> {
    try {
      console.log('🔄 addLogToDaily başlıyor...');
      console.log('📦 logEntry:', JSON.stringify(logEntry, null, 2));
      console.log('📅 targetDate:', targetDate);

      const collection = await this.getCollection();
      const date = targetDate || this.getTodayString();
      console.log('📋 kullanılacak tarih:', date);
      
      const fullLogEntry: LogEntry = {
        ...logEntry,
        timestamp: new Date(),
      };
      console.log('📝 fullLogEntry:', JSON.stringify(fullLogEntry, null, 2));

      // Upsert ile günlük container'ı güncelle veya oluştur
      console.log('💾 MongoDB upsert işlemi başlıyor...');
      const result = await collection.updateOne(
        { date }, // Filter: Bu tarihe ait container
        {
          $push: { logs: fullLogEntry }, // Log'u array'e ekle
          $inc: { logCount: 1 }, // Log sayısını artır
          $set: { updatedAt: new Date() }, // Güncelleme zamanını ayarla
          $setOnInsert: { 
            createdAt: new Date(),
            date: date // İlk oluşturuluyorsa tarih alanını da ekle
          }
        },
        { 
          upsert: true // Container yoksa oluştur
        }
      );

      console.log('✅ MongoDB upsert sonucu:', JSON.stringify(result, null, 2));
      console.log('🆕 Container oluşturuldu mu?:', result.upsertedCount > 0);

      return {
        success: true,
        containerCreated: result.upsertedCount > 0,
        date
      };

    } catch (error) {
      console.error('❌ Error adding log to daily container:', error);
      console.error('❌ Error stack:', error.stack);
      return {
        success: false,
        containerCreated: false,
        date: targetDate || this.getTodayString()
      };
    }
  }

  /**
   * Belirli günün loglarını getir
   */
  async getDailyLogs(date?: string): Promise<DailyLogContainer | null> {
    const collection = await this.getCollection();
    const targetDate = date || this.getTodayString();
    
    try {
      const container = await collection.findOne({ date: targetDate });
      return container;
    } catch (error) {
      console.error('❌ Error getting daily logs:', error);
      return null;
    }
  }

  /**
   * Tarih aralığında log arama
   */
  async searchLogs(query: LogSearchQuery): Promise<{
    logs: LogEntry[];
    totalCount: number;
    containers: DailyLogContainer[];
  }> {
    const collection = await this.getCollection();
    
    try {
      // MongoDB aggregate pipeline ile arama
      const pipeline: any[] = [];
      
      // Tarih filtresi
      const dateFilter: any = {};
      if (query.startDate) {
        dateFilter.$gte = query.startDate;
      }
      if (query.endDate) {
        dateFilter.$lte = query.endDate;
      }
      if (Object.keys(dateFilter).length > 0) {
        pipeline.push({ $match: { date: dateFilter } });
      }
      
      // Logs array'ini unwind et
      pipeline.push({ $unwind: '$logs' });
      
      // Log level filtresi
      const logFilters: any = {};
      if (query.level) {
        logFilters['logs.level'] = query.level;
      }
      if (query.category) {
        logFilters['logs.category'] = query.category;
      }
      if (query.message) {
        logFilters['logs.message'] = { $regex: query.message, $options: 'i' };
      }
      if (Object.keys(logFilters).length > 0) {
        pipeline.push({ $match: logFilters });
      }
      
      // Sorting
      pipeline.push({ $sort: { 'logs.timestamp': -1 } });
      
      // Pagination
      if (query.skip) {
        pipeline.push({ $skip: query.skip });
      }
      if (query.limit) {
        pipeline.push({ $limit: query.limit });
      }
      
      const results = await collection.aggregate(pipeline).toArray();
      
      // Container'ları da al
      const containerDateFilter: any = {};
      if (query.startDate) containerDateFilter.$gte = query.startDate;
      if (query.endDate) containerDateFilter.$lte = query.endDate;
      
      const containers = await collection.find(
        Object.keys(containerDateFilter).length > 0 
          ? { date: containerDateFilter }
          : {}
      ).toArray();
      
      return {
        logs: results.map(r => r.logs),
        totalCount: results.length,
        containers
      };
      
    } catch (error) {
      console.error('❌ Error searching logs:', error);
      return {
        logs: [],
        totalCount: 0,
        containers: []
      };
    }
  }

  /**
   * Tüm günleri listele
   */
  async getAllDates(): Promise<string[]> {
    const collection = await this.getCollection();
    
    try {
      const dates = await collection.distinct('date');
      return dates.sort((a, b) => b.localeCompare(a)); // En yeni tarihler önce
    } catch (error) {
      console.error('❌ Error getting all dates:', error);
      return [];
    }
  }

  /**
   * Günlük istatistikleri
   */
  async getDailyStats(date?: string): Promise<DailyLogStats | null> {
    const targetDate = date || this.getTodayString();
    const container = await this.getDailyLogs(targetDate);
    
    if (!container) {
      return null;
    }

    const stats: DailyLogStats = {
      date: targetDate,
      totalLogs: container.logCount || container.logs.length,
      levelCounts: {
        info: 0,
        warn: 0,
        error: 0,
        debug: 0
      },
      categories: {}
    };

    // Log'ları analiz et
    container.logs.forEach(log => {
      // Level sayıları
      if (log.level in stats.levelCounts) {
        stats.levelCounts[log.level]++;
      }
      
      // Kategori sayıları
      if (log.category) {
        stats.categories[log.category] = (stats.categories[log.category] || 0) + 1;
      }
    });

    return stats;
  }

  /**
   * Test için koleksiyonu temizle
   */
  async clearAllLogs(): Promise<{ deletedCount: number }> {
    const collection = await this.getCollection();
    
    try {
      const result = await collection.deleteMany({});
      console.log(`🧹 Cleared ${result.deletedCount} daily log containers`);
      return { deletedCount: result.deletedCount };
    } catch (error) {
      console.error('❌ Error clearing logs:', error);
      return { deletedCount: 0 };
    }
  }

  /**
   * Belirli tarihteki container'ı sil
   */
  async deleteDailyContainer(date: string): Promise<boolean> {
    const collection = await this.getCollection();
    
    try {
      const result = await collection.deleteOne({ date });
      console.log(`🗑️ Deleted daily container for ${date}: ${result.deletedCount > 0 ? 'Success' : 'Not found'}`);
      return result.deletedCount > 0;
    } catch (error) {
      console.error('❌ Error deleting daily container:', error);
      return false;
    }
  }

  /**
   * Container oluşturma servis/cron yaklaşımı simülasyonu
   */
  async ensureDailyContainer(date?: string): Promise<{ 
    exists: boolean; 
    created: boolean; 
    date: string;
  }> {
    const targetDate = date || this.getTodayString();
    const collection = await this.getCollection();
    
    try {
      // Container var mı kontrol et
      const existing = await collection.findOne({ date: targetDate });
      
      if (existing) {
        return {
          exists: true,
          created: false,
          date: targetDate
        };
      }
      
      // Boş container oluştur (cron/servis yaklaşımı)
      await collection.insertOne({
        date: targetDate,
        logs: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        logCount: 0
      });
      
      console.log(`📅 Created empty daily container for ${targetDate}`);
      
      return {
        exists: false,
        created: true,
        date: targetDate
      };
      
    } catch (error) {
      console.error('❌ Error ensuring daily container:', error);
      return {
        exists: false,
        created: false,
        date: targetDate
      };
    }
  }

  /**
   * Birden fazla log'u toplu ekle (bulk insert)
   */
  async addMultipleLogs(logs: Omit<LogEntry, 'timestamp'>[], targetDate?: string): Promise<{
    success: boolean;
    addedCount: number;
    date: string;
    containerCreated: boolean;
  }> {
    const date = targetDate || this.getTodayString();
    const collection = await this.getCollection();
    
    const fullLogEntries: LogEntry[] = logs.map(log => ({
      ...log,
      timestamp: new Date()
    }));

    try {
      const result = await collection.updateOne(
        { date },
        {
          $push: { logs: { $each: fullLogEntries } },
          $inc: { logCount: fullLogEntries.length },
          $set: { updatedAt: new Date() },
          $setOnInsert: { 
            createdAt: new Date(),
            logCount: 0
          }
        },
        { upsert: true }
      );

      return {
        success: true,
        addedCount: fullLogEntries.length,
        date,
        containerCreated: result.upsertedCount > 0
      };

    } catch (error) {
      console.error('❌ Error adding multiple logs:', error);
      return {
        success: false,
        addedCount: 0,
        date,
        containerCreated: false
      };
    }
  }
}