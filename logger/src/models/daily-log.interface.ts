/**
 * Günlük log container için MongoDB şema tanımları
 */

export interface LogEntry {
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  timestamp: Date;
  metadata?: Record<string, any>;
  source?: string;
  category?: string;
}

export interface DailyLogContainer {
  _id?: string;
  date: string; // YYYY-MM-DD formatında
  logs: LogEntry[];
  createdAt: Date;
  updatedAt: Date;
  logCount: number;
}

export interface LogSearchQuery {
  startDate?: string;
  endDate?: string;
  level?: string;
  category?: string;
  message?: string;
  limit?: number;
  skip?: number;
}

export interface DailyLogStats {
  date: string;
  totalLogs: number;
  levelCounts: {
    info: number;
    warn: number;
    error: number;
    debug: number;
  };
  categories: Record<string, number>;
}