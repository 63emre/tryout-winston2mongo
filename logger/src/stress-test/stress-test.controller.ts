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

  @Get('concurrent')
  async concurrentStressTest(
    @Query('count') count: string = '10000',
    @Query('concurrent') concurrent: string = '5'
  ): Promise<any> {
    const logCount = parseInt(count, 10);
    const concurrentRequests = parseInt(concurrent, 10);
    
    console.log(`🔥 CONCURRENT TEST: ${concurrentRequests} parallel requests, ${logCount} logs each`);
    console.log(`📊 Total logs: ${logCount * concurrentRequests}`);
    
    const startTime = Date.now();
    
    // Aynı anda birden fazla test çalıştır
    const promises = Array(concurrentRequests).fill(0).map(async (_, index) => {
      console.log(`🚀 Starting concurrent request ${index + 1}`);
      return await this.stressTestService.testWinstonMongoDB(logCount);
    });
    
    try {
      const results = await Promise.all(promises);
      const endTime = Date.now();
      const totalDuration = endTime - startTime;
      
      const totalLogs = logCount * concurrentRequests;
      const totalLogsPerSecond = Math.round(totalLogs / (totalDuration / 1000));
      
      const avgLogsPerSecond = results.reduce((sum, r) => sum + r.logsPerSecond, 0) / results.length;
      const totalErrors = results.reduce((sum, r) => sum + r.errors, 0);
      
      return {
        concurrentRequests,
        logsPerRequest: logCount,
        totalLogs,
        totalDuration,
        totalLogsPerSecond,
        avgLogsPerSecondPerRequest: Math.round(avgLogsPerSecond),
        totalErrors,
        results,
        analysis: {
          message: totalLogsPerSecond > 50000 
            ? '🚀 EXCELLENT: System handles high concurrent load very well!'
            : totalLogsPerSecond > 20000 
            ? '✅ GOOD: Decent performance under concurrent load'
            : '⚠️ WARNING: Performance degrades under concurrent load',
          recommendation: totalErrors > 0 
            ? 'Consider implementing rate limiting or connection pooling'
            : 'System is stable under concurrent load'
        }
      };
    } catch (error) {
      return {
        error: `Concurrent test failed: ${error.message}`,
        partialResults: 'Some requests may have completed'
      };
    }
  }

  @Get('sync-test')
  async synchronousTest(
    @Query('count') count: string = '10000'
  ): Promise<{
    winston: any;
    bulkWrite: any;
    realComparison: any;
  }> {
    const logCount = parseInt(count, 10);
    console.log(`⏱️ SYNCHRONOUS TEST: Waiting for ALL operations to complete - ${logCount} logs`);
    
    // Winston test - gerçekten bitmesini bekle
    console.log('🧪 Phase 1: Winston (waiting for completion)...');
    const winstonStartTime = Date.now();
    const winstonResult = await this.stressTestService.testWinstonMongoDB(logCount);
    
    // Ekstra bekleme - logların gerçekten yazıldığından emin ol
    console.log('⏳ Waiting additional 3 seconds for Winston logs to flush...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    const winstonRealDuration = Date.now() - winstonStartTime;
    
    // Bulk write test
    console.log('🚀 Phase 2: Bulk Write...');
    const bulkStartTime = Date.now();
    await this.stressTestService.connectMongo();
    const bulkResult = await this.stressTestService.testBulkWrite(logCount);
    const bulkRealDuration = Date.now() - bulkStartTime;
    
    const realComparison = {
      winstonRealSpeed: Math.round(logCount / (winstonRealDuration / 1000)),
      bulkWriteRealSpeed: Math.round(logCount / (bulkRealDuration / 1000)),
      speedDifference: ((Math.round(logCount / (bulkRealDuration / 1000)) - Math.round(logCount / (winstonRealDuration / 1000))) / Math.round(logCount / (winstonRealDuration / 1000)) * 100).toFixed(2) + '%',
      winstonRealDuration,
      bulkRealDuration,
      verdict: Math.round(logCount / (bulkRealDuration / 1000)) > Math.round(logCount / (winstonRealDuration / 1000)) 
        ? 'Bulk Write is ACTUALLY faster when waiting for completion'
        : 'Winston-MongoDB is faster even with sync waiting'
    };
    
    console.log(`🎯 REAL PERFORMANCE RESULTS:`);
    console.log(`   Winston (with flush): ${realComparison.winstonRealSpeed} logs/sec`);
    console.log(`   Bulk Write: ${realComparison.bulkWriteRealSpeed} logs/sec`);
    console.log(`   Difference: ${realComparison.speedDifference}`);
    console.log(`   Verdict: ${realComparison.verdict}`);
    
    return {
      winston: {
        ...winstonResult,
        realDuration: winstonRealDuration,
        realLogsPerSecond: realComparison.winstonRealSpeed
      },
      bulkWrite: {
        ...bulkResult,
        realDuration: bulkRealDuration,
        realLogsPerSecond: realComparison.bulkWriteRealSpeed
      },
      realComparison
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