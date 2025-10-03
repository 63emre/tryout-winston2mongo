import { Controller, Get, Query, Post } from '@nestjs/common';
import { StressTestService, StressTestResult } from './stress-test.service';

@Controller('stress-test')
export class StressTestController {
  constructor(private readonly stressTestService: StressTestService) {}

  @Get('winston-mongodb')
  async testWinstonMongoDB(
    @Query('count') count: string = '10000'
  ): Promise<StressTestResult> {
    const logCount = parseInt(count, 10);
    console.log(`🧪 Starting Winston-MongoDB test with ${logCount} logs`);
    
    return await this.stressTestService.testWinstonMongoDB(logCount);
  }

  @Get('bulk-write')
  async testBulkWrite(
    @Query('count') count: string = '10000'
  ): Promise<StressTestResult> {
    const logCount = parseInt(count, 10);
    console.log(`🚀 Starting Bulk Write test with ${logCount} logs`);
    
    await this.stressTestService.connectMongo();
    return await this.stressTestService.testBulkWrite(logCount);
  }

  @Get('compare')
  async comparePerformance(
    @Query('count') count: string = '10000'
  ): Promise<{
    winston: StressTestResult;
    bulkWrite: StressTestResult;
    comparison: any;
  }> {
    const logCount = parseInt(count, 10);
    console.log(`🏁 Starting performance comparison with ${logCount} logs each`);
    
    return await this.stressTestService.comparePerformance(logCount);
  }

  @Get('real-time')
  async realTimeStressTest(
    @Query('count') count: string = '50000',
    @Query('interval') interval: string = '100'
  ): Promise<{ message: string }> {
    const logCount = parseInt(count, 10);
    const intervalMs = parseInt(interval, 10);
    
    // Bu async olarak çalışacak, response hemen dönecek
    this.stressTestService.realTimeStressTest(logCount, intervalMs);
    
    return { 
      message: `Real-time stress test started: ${logCount} logs with ${intervalMs}ms intervals. Check console for progress.` 
    };
  }

  @Post('cleanup')
  async cleanup(): Promise<{ message: string }> {
    await this.stressTestService.connectMongo();
    await this.stressTestService.cleanupTestCollections();
    return { message: 'Test collections cleaned up successfully' };
  }

  @Get('extreme')
  async extremeStressTest(
    @Query('count') count: string = '100000'
  ): Promise<{
    winston: StressTestResult;
    bulkWrite: StressTestResult;
    comparison: any;
  }> {
    const logCount = parseInt(count, 10);
    console.log(`💥 EXTREME STRESS TEST: ${logCount} logs each method`);
    console.log('⚠️  This may take several minutes...');
    
    return await this.stressTestService.comparePerformance(logCount);
  }

  @Get('memory-leak-test')
  async memoryLeakTest(
    @Query('rounds') rounds: string = '10',
    @Query('logsPerRound') logsPerRound: string = '5000'
  ): Promise<{ 
    rounds: any[];
    memoryLeakDetected: boolean;
    recommendation: string;
  }> {
    const roundCount = parseInt(rounds, 10);
    const logsCount = parseInt(logsPerRound, 10);
    
    console.log(`🧠 Memory leak test: ${roundCount} rounds x ${logsCount} logs`);
    
    const roundResults: any[] = [];
    let initialMemory: NodeJS.MemoryUsage | null = null;
    
    for (let round = 1; round <= roundCount; round++) {
      console.log(`\n🔄 Round ${round}/${roundCount}`);
      
      const beforeMemory = process.memoryUsage();
      if (!initialMemory) initialMemory = beforeMemory;
      
      // Winston test
      const winstonResult = await this.stressTestService.testWinstonMongoDB(logsCount);
      
      // Garbage collection zorla (eğer expose edilmişse)
      if (global.gc) {
        global.gc();
      }
      
      const afterMemory = process.memoryUsage();
      
      roundResults.push({
        round,
        winstonResult: {
          logsPerSecond: winstonResult.logsPerSecond,
          errors: winstonResult.errors
        },
        memoryBefore: beforeMemory,
        memoryAfter: afterMemory,
        memoryGrowth: {
          rss: ((afterMemory.rss - beforeMemory.rss) / (1024 * 1024)).toFixed(2) + ' MB',
          heapUsed: ((afterMemory.heapUsed - beforeMemory.heapUsed) / (1024 * 1024)).toFixed(2) + ' MB'
        }
      });
      
      console.log(`📊 Round ${round} - Memory growth: RSS +${roundResults[round-1].memoryGrowth.rss}, Heap +${roundResults[round-1].memoryGrowth.heapUsed}`);
      
      // Biraz bekle
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Memory leak analizi
    const finalMemory = process.memoryUsage();
    const totalGrowth = finalMemory.rss - initialMemory!.rss;
    const memoryLeakDetected = totalGrowth > (100 * 1024 * 1024); // 100MB üzeri şüpheli
    
    let recommendation = '';
    if (memoryLeakDetected) {
      recommendation = 'MEMORY LEAK DETECTED! RSS grew more than 100MB. Consider using bulk write or implementing connection pooling.';
    } else {
      recommendation = 'Memory usage appears stable. No significant memory leak detected.';
    }
    
    return {
      rounds: roundResults,
      memoryLeakDetected,
      recommendation
    };
  }

  @Get('benchmark')
  async benchmark(): Promise<{
    lightLoad: any;
    mediumLoad: any;
    heavyLoad: any;
    extremeLoad: any;
    summary: string;
  }> {
    console.log('🎯 Starting comprehensive benchmark...');
    
    const tests = [
      { name: 'lightLoad', count: 1000 },
      { name: 'mediumLoad', count: 10000 },
      { name: 'heavyLoad', count: 50000 },
      { name: 'extremeLoad', count: 100000 }
    ];
    
    const results: any = {};
    
    for (const test of tests) {
      console.log(`\n🧪 ${test.name}: ${test.count} logs`);
      
      try {
        results[test.name] = await this.stressTestService.comparePerformance(test.count);
        
        console.log(`✅ ${test.name} completed`);
        console.log(`   Winston: ${results[test.name].winston.logsPerSecond} logs/sec`);
        console.log(`   BulkWrite: ${results[test.name].bulkWrite.logsPerSecond} logs/sec`);
        console.log(`   Improvement: ${results[test.name].comparison.speedImprovement}`);
        
        // Testler arası temizlik
        await this.stressTestService.cleanupTestCollections();
        await new Promise(resolve => setTimeout(resolve, 2000));
        
      } catch (error) {
        console.error(`❌ ${test.name} failed:`, error.message);
        results[test.name] = { error: error.message };
      }
    }
    
    // Özet çıkar
    const summary = this.generateBenchmarkSummary(results);
    
    return {
      ...results,
      summary
    };
  }

  private generateBenchmarkSummary(results: any): string {
    let summary = '📊 BENCHMARK SUMMARY:\n\n';
    
    Object.entries(results).forEach(([testName, result]: [string, any]) => {
      if (result.error) {
        summary += `❌ ${testName}: FAILED - ${result.error}\n`;
      } else {
        summary += `✅ ${testName}:\n`;
        summary += `   • Winston: ${result.winston.logsPerSecond} logs/sec (${result.winston.errors} errors)\n`;
        summary += `   • BulkWrite: ${result.bulkWrite.logsPerSecond} logs/sec (${result.bulkWrite.errors} errors)\n`;
        summary += `   • Speed improvement: ${result.comparison.speedImprovement}\n`;
        summary += `   • Latency improvement: ${result.comparison.latencyImprovement}\n\n`;
      }
    });
    
    summary += '🎯 RECOMMENDATION:\n';
    summary += 'For high-volume logging (>10k logs/sec), use bulk write method.\n';
    summary += 'For real-time logging with low latency requirements, Winston-MongoDB is sufficient.\n';
    
    return summary;
  }
}