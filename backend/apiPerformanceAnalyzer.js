const analyzeApiPerformance = async (logContent) => {
  const lines = logContent.split('\n');
  const apiMetrics = {
    summary: {
      totalApiCalls: 0,
      averageResponseTime: 0,
      minResponseTime: Number.MAX_VALUE,
      maxResponseTime: 0,
      totalProcessingTime: 0,
      successCount: 0,
      failureCount: 0,
      apiCallsByCommand: {},
      apiCallsByClass: {},
      performanceByHour: {},
      slowApis: [],
      fastApis: [],
      successRate: 0
    },
    failedApis: [],
    endpoints: {},
    timeline: [],
    performanceDistribution: {
      under100ms: 0,
      under500ms: 0,
      under1000ms: 0,
      under5000ms: 0,
      over5000ms: 0
    },
    recommendations: []
  };

  const performanceLogPattern = /\[PerformanceLogger.*?\]\s*\[Class=([^,]+),\s*CommandName=([^,]+),.*?ReturnCode=(\d+),.*?StatusKey=([^\]]+)\].*?Total Processing Time:(\d+)\s*ms/i;
  const timestampPattern = /^(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2})/;
  const requestIdPattern = /\b([a-f\d]{8}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{12})\b/i;

  const apiCalls = [];

  lines.forEach((line, index) => {
    const perfMatch = line.match(performanceLogPattern);
    if (perfMatch) {
      const [_, className, commandName, returnCode, statusKey, processingTime] = perfMatch;
      const timestamp = extractTimestamp(line, timestampPattern);
      const requestId = extractRequestId(line, requestIdPattern);
      const processingTimeMs = parseInt(processingTime);
      
      const apiCall = {
        lineNumber: index + 1,
        timestamp,
        requestId,
        className,
        commandName,
        returnCode: parseInt(returnCode),
        statusKey,
        processingTime: processingTimeMs,
        isSuccess: returnCode === '0' || statusKey.toLowerCase().includes('success'),
        line: line.trim()
      };

      apiCalls.push(apiCall);
      
      // Update metrics
      apiMetrics.summary.totalApiCalls++;
      apiMetrics.summary.totalProcessingTime += processingTimeMs;
      
      if (apiCall.isSuccess) {
        apiMetrics.summary.successCount++;
      } else {
        apiMetrics.summary.failureCount++;
        apiMetrics.failedApis.push(apiCall);
      }

      // Track min/max response times
      if (processingTimeMs < apiMetrics.summary.minResponseTime) {
        apiMetrics.summary.minResponseTime = processingTimeMs;
      }
      if (processingTimeMs > apiMetrics.summary.maxResponseTime) {
        apiMetrics.summary.maxResponseTime = processingTimeMs;
      }

      // Update performance distribution
      if (processingTimeMs < 100) {
        apiMetrics.performanceDistribution.under100ms++;
      } else if (processingTimeMs < 500) {
        apiMetrics.performanceDistribution.under500ms++;
      } else if (processingTimeMs < 1000) {
        apiMetrics.performanceDistribution.under1000ms++;
      } else if (processingTimeMs < 5000) {
        apiMetrics.performanceDistribution.under5000ms++;
      } else {
        apiMetrics.performanceDistribution.over5000ms++;
      }

      // Track by command name
      if (!apiMetrics.summary.apiCallsByCommand[commandName]) {
        apiMetrics.summary.apiCallsByCommand[commandName] = {
          count: 0,
          totalTime: 0,
          avgTime: 0,
          minTime: Number.MAX_VALUE,
          maxTime: 0,
          successCount: 0,
          failureCount: 0
        };
      }
      const cmdMetrics = apiMetrics.summary.apiCallsByCommand[commandName];
      cmdMetrics.count++;
      cmdMetrics.totalTime += processingTimeMs;
      cmdMetrics.avgTime = Math.round(cmdMetrics.totalTime / cmdMetrics.count);
      cmdMetrics.minTime = Math.min(cmdMetrics.minTime, processingTimeMs);
      cmdMetrics.maxTime = Math.max(cmdMetrics.maxTime, processingTimeMs);
      if (apiCall.isSuccess) {
        cmdMetrics.successCount++;
      } else {
        cmdMetrics.failureCount++;
      }

      // Track by class name
      if (!apiMetrics.summary.apiCallsByClass[className]) {
        apiMetrics.summary.apiCallsByClass[className] = {
          count: 0,
          totalTime: 0,
          avgTime: 0,
          commands: new Set()
        };
      }
      const classMetrics = apiMetrics.summary.apiCallsByClass[className];
      classMetrics.count++;
      classMetrics.totalTime += processingTimeMs;
      classMetrics.avgTime = Math.round(classMetrics.totalTime / classMetrics.count);
      classMetrics.commands.add(commandName);

      // Track performance by hour
      if (timestamp) {
        const hour = new Date(timestamp).getHours();
        if (!apiMetrics.summary.performanceByHour[hour]) {
          apiMetrics.summary.performanceByHour[hour] = {
            count: 0,
            totalTime: 0,
            avgTime: 0
          };
        }
        const hourMetrics = apiMetrics.summary.performanceByHour[hour];
        hourMetrics.count++;
        hourMetrics.totalTime += processingTimeMs;
        hourMetrics.avgTime = Math.round(hourMetrics.totalTime / hourMetrics.count);
      }

      // Build detailed endpoint metrics
      const endpointKey = `${className}::${commandName}`;
      if (!apiMetrics.endpoints[endpointKey]) {
        apiMetrics.endpoints[endpointKey] = {
          className,
          commandName,
          calls: [],
          metrics: {
            count: 0,
            avgResponseTime: 0,
            minResponseTime: Number.MAX_VALUE,
            maxResponseTime: 0,
            p50: 0,
            p95: 0,
            p99: 0,
            successRate: 0
          }
        };
      }
      apiMetrics.endpoints[endpointKey].calls.push(apiCall);
    }
  });

  // Calculate aggregate metrics
  if (apiMetrics.summary.totalApiCalls > 0) {
    apiMetrics.summary.averageResponseTime = Math.round(
      apiMetrics.summary.totalProcessingTime / apiMetrics.summary.totalApiCalls
    );
    apiMetrics.summary.successRate = 
      (apiMetrics.summary.successCount / apiMetrics.summary.totalApiCalls * 100).toFixed(2);
  }

  if (apiMetrics.summary.minResponseTime === Number.MAX_VALUE) {
    apiMetrics.summary.minResponseTime = 0;
  }

  // Convert Set to Array for class commands
  Object.values(apiMetrics.summary.apiCallsByClass).forEach(classMetric => {
    classMetric.commands = Array.from(classMetric.commands);
  });

  // Calculate percentiles and identify slow/fast APIs
  Object.values(apiMetrics.endpoints).forEach(endpoint => {
    const times = endpoint.calls.map(call => call.processingTime).sort((a, b) => a - b);
    const metrics = endpoint.metrics;
    
    metrics.count = endpoint.calls.length;
    metrics.minResponseTime = Math.min(...times);
    metrics.maxResponseTime = Math.max(...times);
    metrics.avgResponseTime = Math.round(times.reduce((a, b) => a + b, 0) / times.length);
    
    // Calculate percentiles
    metrics.p50 = calculatePercentile(times, 50);
    metrics.p95 = calculatePercentile(times, 95);
    metrics.p99 = calculatePercentile(times, 99);
    
    const successCount = endpoint.calls.filter(call => call.isSuccess).length;
    metrics.successRate = (successCount / metrics.count * 100).toFixed(2);
  });

  // Identify slow and fast APIs
  const sortedEndpoints = Object.entries(apiMetrics.endpoints)
    .map(([key, endpoint]) => ({
      key,
      ...endpoint,
      avgTime: endpoint.metrics.avgResponseTime
    }))
    .sort((a, b) => b.avgTime - a.avgTime);

  apiMetrics.slowApis = sortedEndpoints.slice(0, 10).map(formatApiMetric);
  apiMetrics.fastApis = sortedEndpoints.filter(e => e.avgTime < 100).slice(-10).reverse().map(formatApiMetric);

  // Build timeline
  apiMetrics.timeline = apiCalls
    .filter(call => call.timestamp)
    .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
    .map(call => ({
      timestamp: call.timestamp,
      commandName: call.commandName,
      className: call.className,
      processingTime: call.processingTime,
      status: call.isSuccess ? 'SUCCESS' : 'FAILURE',
      returnCode: call.returnCode
    }));

  // Generate recommendations
  apiMetrics.recommendations = generatePerformanceRecommendations(apiMetrics);

  return apiMetrics;
};

const extractTimestamp = (line, pattern) => {
  const match = line.match(pattern);
  return match ? match[1] : null;
};

const extractRequestId = (line, pattern) => {
  const match = line.match(pattern);
  return match ? match[1] : null;
};

const calculatePercentile = (sortedArray, percentile) => {
  if (sortedArray.length === 0) return 0;
  const index = Math.ceil((percentile / 100) * sortedArray.length) - 1;
  return sortedArray[index];
};

const formatApiMetric = (endpoint) => ({
  className: endpoint.className,
  commandName: endpoint.commandName,
  avgResponseTime: endpoint.metrics.avgResponseTime,
  callCount: endpoint.metrics.count,
  successRate: endpoint.metrics.successRate,
  p95: endpoint.metrics.p95,
  p99: endpoint.metrics.p99
});

const generatePerformanceRecommendations = (metrics) => {
  const recommendations = [];

  // Check for slow APIs
  const slowApisThreshold = 1000; // 1 second
  const verySlowApis = metrics.slowApis.filter(api => api.avgResponseTime > slowApisThreshold);
  
  if (verySlowApis.length > 0) {
    recommendations.push({
      severity: 'HIGH',
      category: 'Performance',
      issue: 'Slow API endpoints detected',
      description: `${verySlowApis.length} API endpoints have average response times over ${slowApisThreshold}ms`,
      suggestions: [
        'Profile these endpoints to identify bottlenecks',
        'Consider adding caching for frequently accessed data',
        'Optimize database queries in these endpoints',
        'Review algorithmic complexity',
        'Consider async processing for long-running operations'
      ],
      affectedApis: verySlowApis.slice(0, 5).map(api => 
        `${api.commandName} (avg: ${api.avgResponseTime}ms)`
      )
    });
  }

  // Check for high failure rate APIs
  const highFailureApis = Object.entries(metrics.summary.apiCallsByCommand)
    .filter(([_, stats]) => {
      const failureRate = (stats.failureCount / stats.count) * 100;
      return failureRate > 10 && stats.count > 5;
    })
    .map(([command, stats]) => ({
      command,
      failureRate: ((stats.failureCount / stats.count) * 100).toFixed(2),
      count: stats.count
    }));

  if (highFailureApis.length > 0) {
    recommendations.push({
      severity: 'CRITICAL',
      category: 'Reliability',
      issue: 'High failure rate detected',
      description: `${highFailureApis.length} API endpoints have failure rates above 10%`,
      suggestions: [
        'Investigate error logs for these endpoints',
        'Review input validation and error handling',
        'Check for data quality issues',
        'Verify external service dependencies',
        'Add retry mechanisms for transient failures'
      ],
      affectedApis: highFailureApis.slice(0, 5).map(api => 
        `${api.command} (failure rate: ${api.failureRate}%, calls: ${api.count})`
      )
    });
  }

  // Check for performance degradation by hour
  const hourlyMetrics = Object.entries(metrics.summary.performanceByHour)
    .map(([hour, stats]) => ({ hour: parseInt(hour), ...stats }))
    .sort((a, b) => b.avgTime - a.avgTime);

  if (hourlyMetrics.length > 0 && hourlyMetrics[0].avgTime > metrics.summary.averageResponseTime * 1.5) {
    recommendations.push({
      severity: 'MEDIUM',
      category: 'Performance Patterns',
      issue: 'Performance degradation during specific hours',
      description: `Response times are significantly higher during certain hours`,
      suggestions: [
        'Check for scheduled batch jobs during peak hours',
        'Monitor resource utilization patterns',
        'Consider scaling resources during peak times',
        'Review concurrent request handling',
        'Implement request queuing or rate limiting'
      ],
      peakHours: hourlyMetrics.slice(0, 3).map(h => 
        `${h.hour}:00 (avg: ${h.avgTime}ms)`
      )
    });
  }

  // Check overall performance distribution
  const slowCallsPercentage = 
    ((metrics.performanceDistribution.over5000ms / metrics.summary.totalApiCalls) * 100);
  
  if (slowCallsPercentage > 5) {
    recommendations.push({
      severity: 'HIGH',
      category: 'Performance Distribution',
      issue: 'High percentage of slow API calls',
      description: `${slowCallsPercentage.toFixed(2)}% of API calls take over 5 seconds`,
      suggestions: [
        'Identify and optimize the slowest operations',
        'Implement pagination for large data sets',
        'Add progress indicators for long-running operations',
        'Consider background job processing',
        'Review timeout configurations'
      ]
    });
  }

  // Success rate recommendations
  if (parseFloat(metrics.summary.successRate) < 95) {
    recommendations.push({
      severity: 'HIGH',
      category: 'Reliability',
      issue: 'Low overall success rate',
      description: `Overall API success rate is ${metrics.summary.successRate}% (below 95% threshold)`,
      suggestions: [
        'Implement comprehensive error handling',
        'Add input validation at API gateway level',
        'Review and fix common error patterns',
        'Implement circuit breaker patterns',
        'Add health checks and monitoring'
      ]
    });
  }

  return recommendations;
};

module.exports = {
  analyzeApiPerformance
};