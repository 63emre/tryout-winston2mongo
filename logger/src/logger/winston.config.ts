import * as winston from 'winston';
import * as path from 'path';
import 'winston-mongodb';

const { combine, timestamp, json, printf, colorize, simple } = winston.format;

// Özel format tanımla
const customFormat = printf(({ level, message, timestamp, category, userId, action, ...meta }) => {
  return JSON.stringify({
    timestamp,
    level,
    category,
    message,
    userId,
    action,
    metadata: meta
  });
});

// Log kategorileri
export enum LogCategory {
  AUTH = 'auth',
  CLOUD = 'cloud',
  MIC = 'microphone',
  SYSTEM = 'system',
  USER = 'user'
}

// Winston logger konfigürasyonları
export class WinstonLogger {
  private static loggers: Map<LogCategory, winston.Logger> = new Map();

  static getLogger(category: LogCategory): winston.Logger {
    if (!this.loggers.has(category)) {
      this.loggers.set(category, this.createLogger(category));
    }
    return this.loggers.get(category)!;
  }

  private static createLogger(category: LogCategory): winston.Logger {
    const logDir = path.join(process.cwd(), '..', 'logs', category);
    
    const transports: winston.transport[] = [
      // Console transport (development için)
      new winston.transports.Console({
        format: combine(
          colorize(),
          timestamp(),
          simple()
        )
      }),
      
      // File transport - JSON formatında
      new winston.transports.File({
        filename: path.join(logDir, `${category}-${new Date().toISOString().split('T')[0]}.log`),
        format: combine(
          timestamp(),
          customFormat
        ),
        maxsize: 10 * 1024 * 1024, // 10MB
        maxFiles: 30
      }),
      
      // Error logs için ayrı dosya
      new winston.transports.File({
        filename: path.join(logDir, `${category}-error-${new Date().toISOString().split('T')[0]}.log`),
        level: 'error',
        format: combine(
          timestamp(),
          customFormat
        ),
        maxsize: 10 * 1024 * 1024, // 10MB
        maxFiles: 30
      })
    ];

    return winston.createLogger({
      level: 'debug',
      format: combine(
        timestamp(),
        json()
      ),
      transports,
      defaultMeta: { category }
    });
  }

  // MongoDB transport eklemek için
  static addMongoTransport(category: LogCategory, mongoUrl: string = 'mongodb://localhost:27017/logs') {
    const logger = this.getLogger(category);
    
    logger.add(new winston.transports.MongoDB({
      db: mongoUrl,
      collection: `logs_${category}`,
      format: combine(
        timestamp(),
        json()
      ),
      options: {
        useNewUrlParser: true,
        useUnifiedTopology: true
      }
    }));
  }

  // Tüm kategoriler için MongoDB transport ekle
  static enableMongoDBForAll(mongoUrl: string = 'mongodb://localhost:27017/logs') {
    Object.values(LogCategory).forEach(category => {
      this.addMongoTransport(category, mongoUrl);
    });
  }
}