/**
 * Tests for performance metrics and monitoring system
 */

import { metrics, PerformanceMonitor } from '../../services/metrics';

describe('Metrics System', () => {
  
  beforeEach(() => {
    metrics.clear();
  });
  
  describe('Basic Metrics Recording', () => {
    test('should record API call metrics', () => {
      metrics.recordApiCall({
        endpoint: '/api/test',
        method: 'GET',
        responseTime: 150,
        statusCode: 200,
        success: true
      });
      
      const stats = metrics.getStats(3600000); // 1 hour
      
      expect(stats.totalRequests).toBe(1);
      expect(stats.successRate).toBe(100);
      expect(stats.averageResponseTime).toBe(150);
    });
    
    test('should record error metrics', () => {
      metrics.recordApiCall({
        endpoint: '/api/test',
        method: 'POST',
        responseTime: 500,
        statusCode: 404,
        success: false,
        errorType: 'NotFound'
      });
      
      const stats = metrics.getStats();
      
      expect(stats.totalRequests).toBe(1);
      expect(stats.successRate).toBe(0);
      expect(stats.errorsByType.NotFound).toBe(1);
    });
    
    test('should calculate percentiles correctly', () => {
      // Add multiple metrics with different response times
      const responseTimes = [100, 200, 300, 400, 500, 600, 700, 800, 900, 1000];
      
      responseTimes.forEach(time => {
        metrics.recordApiCall({
          endpoint: '/api/test',
          method: 'GET',
          responseTime: time,
          statusCode: 200,
          success: true
        });
      });
      
      const stats = metrics.getStats();
      
      expect(stats.averageResponseTime).toBe(550);
      expect(stats.p95ResponseTime).toBeGreaterThanOrEqual(900); // Should be near 950
      expect(stats.p99ResponseTime).toBeGreaterThanOrEqual(990); // Should be near 990
    });
  });
  
  describe('Time Range Filtering', () => {
    test('should filter metrics by time range', () => {
      const now = Date.now();
      
      // Add old metric (2 hours ago)
      metrics.recordApiCall({
        endpoint: '/api/old',
        method: 'GET',
        responseTime: 100,
        statusCode: 200,
        success: true
      });
      
      // Manually adjust timestamp for testing
      const metricsArray = (metrics as any).metrics;
      metricsArray[0].timestamp = now - 7200000; // 2 hours ago
      
      // Add recent metric
      metrics.recordApiCall({
        endpoint: '/api/recent',
        method: 'GET',
        responseTime: 200,
        statusCode: 200,
        success: true
      });
      
      // Should only include recent metric in 1 hour window
      const stats = metrics.getStats(3600000); // 1 hour
      expect(stats.totalRequests).toBe(1);
      expect(stats.averageResponseTime).toBe(200);
      
      // Should include both in 3 hour window
      const statsLonger = metrics.getStats(10800000); // 3 hours
      expect(statsLonger.totalRequests).toBe(2);
    });
  });
  
  describe('Endpoint-specific Stats', () => {
    test('should get stats for specific endpoint', () => {
      metrics.recordApiCall({
        endpoint: '/api/login',
        method: 'POST',
        responseTime: 1000,
        statusCode: 200,
        success: true
      });
      
      metrics.recordApiCall({
        endpoint: '/api/companies/123',
        method: 'GET',
        responseTime: 500,
        statusCode: 200,
        success: true
      });
      
      const loginStats = metrics.getEndpointStats('/api/login');
      const companiesStats = metrics.getEndpointStats('/api/companies/123');
      
      expect(loginStats.totalRequests).toBe(1);
      expect(loginStats.averageResponseTime).toBe(1000);
      
      expect(companiesStats.totalRequests).toBe(1);
      expect(companiesStats.averageResponseTime).toBe(500);
    });
  });
  
  describe('Error Tracking', () => {
    test('should track recent errors', () => {
      metrics.recordApiCall({
        endpoint: '/api/test1',
        method: 'GET',
        responseTime: 100,
        statusCode: 404,
        success: false,
        errorType: 'NotFound'
      });
      
      metrics.recordApiCall({
        endpoint: '/api/test2',
        method: 'POST',
        responseTime: 200,
        statusCode: 500,
        success: false,
        errorType: 'ServerError'
      });
      
      const recentErrors = metrics.getRecentErrors(5);
      
      expect(recentErrors).toHaveLength(2);
      expect(recentErrors[0].errorType).toBe('ServerError'); // Most recent first
      expect(recentErrors[1].errorType).toBe('NotFound');
    });
  });
  
  describe('Performance Monitor', () => {
    test('should identify healthy system', () => {
      // Add successful requests
      for (let i = 0; i < 10; i++) {
        metrics.recordApiCall({
          endpoint: '/api/test',
          method: 'GET',
          responseTime: 100 + i * 10, // 100-190ms
          statusCode: 200,
          success: true
        });
      }
      
      const isHealthy = PerformanceMonitor.isHealthy();
      const healthStatus = PerformanceMonitor.getHealthStatus();
      
      expect(isHealthy).toBe(true);
      expect(healthStatus.healthy).toBe(true);
      expect(healthStatus.issues).toHaveLength(0);
    });
    
    test('should identify unhealthy system - low success rate', () => {
      // Add mostly failed requests
      for (let i = 0; i < 8; i++) {
        metrics.recordApiCall({
          endpoint: '/api/test',
          method: 'GET',
          responseTime: 200,
          statusCode: 500,
          success: false,
          errorType: 'ServerError'
        });
      }
      
      // Add few successful requests
      for (let i = 0; i < 2; i++) {
        metrics.recordApiCall({
          endpoint: '/api/test',
          method: 'GET',
          responseTime: 200,
          statusCode: 200,
          success: true
        });
      }
      
      const isHealthy = PerformanceMonitor.isHealthy();
      const healthStatus = PerformanceMonitor.getHealthStatus();
      
      expect(isHealthy).toBe(false);
      expect(healthStatus.healthy).toBe(false);
      expect(healthStatus.issues.some(issue => issue.includes('success rate'))).toBe(true);
    });
    
    test('should identify unhealthy system - high response times', () => {
      // Add slow requests
      for (let i = 0; i < 5; i++) {
        metrics.recordApiCall({
          endpoint: '/api/test',
          method: 'GET',
          responseTime: 6000, // 6 seconds
          statusCode: 200,
          success: true
        });
      }
      
      const isHealthy = PerformanceMonitor.isHealthy();
      const healthStatus = PerformanceMonitor.getHealthStatus();
      
      expect(isHealthy).toBe(false);
      expect(healthStatus.healthy).toBe(false);
      expect(healthStatus.issues.some(issue => issue.includes('response time'))).toBe(true);
    });
  });
  
  describe('Performance Report', () => {
    test('should generate comprehensive report', () => {
      // Add mixed metrics
      metrics.recordApiCall({
        endpoint: '/api/login',
        method: 'POST',
        responseTime: 1500,
        statusCode: 200,
        success: true
      });
      
      metrics.recordApiCall({
        endpoint: '/api/companies/123',
        method: 'GET',
        responseTime: 300,
        statusCode: 404,
        success: false,
        errorType: 'NotFound'
      });
      
      metrics.recordApiCall({
        endpoint: '/api/companies/456',
        method: 'GET',
        responseTime: 200,
        statusCode: 200,
        success: true
      });
      
      const report = PerformanceMonitor.generateReport(3600000);
      
      expect(report).toContain('API Performance Report');
      expect(report).toContain('Total Requests: 3');
      expect(report).toContain('Success Rate: 66.7%');
      expect(report).toContain('Average: ');
      expect(report).toContain('NotFound: 1');
    });
    
    test('should handle empty metrics gracefully', () => {
      const report = PerformanceMonitor.generateReport();
      
      expect(report).toContain('API Performance Report');
      expect(report).toContain('No API calls in the specified time range');
    });
  });
  
  describe('Memory Management', () => {
    test('should limit metrics storage to prevent memory leaks', () => {
      // Add more metrics than the limit
      for (let i = 0; i < 1200; i++) {
        metrics.recordApiCall({
          endpoint: `/api/test${i}`,
          method: 'GET',
          responseTime: 100,
          statusCode: 200,
          success: true
        });
      }
      
      const stats = metrics.getStats(86400000); // 24 hours (should capture all)
      
      // Should be limited to maxMetrics (1000)
      expect(stats.totalRequests).toBe(1000);
    });
  });
});