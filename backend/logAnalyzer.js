const analyzeJavaLogs = async (logContent) => {
  const lines = logContent.split('\n');
  const analysis = {
    summary: {
      totalLines: lines.length,
      errorCount: 0,
      warningCount: 0,
      infoCount: 0,
      debugCount: 0,
      criticalErrors: []
    },
    patterns: {
      outOfMemory: [],
      nullPointer: [],
      connectionTimeout: [],
      sqlExceptions: [],
      classNotFound: [],
      threadDeadlock: [],
      performanceIssues: []
    },
    timeline: [],
    recommendations: []
  };

  const errorPatterns = {
    outOfMemory: /OutOfMemoryError|java\.lang\.OutOfMemoryError|heap space/i,
    nullPointer: /NullPointerException|java\.lang\.NullPointerException/i,
    connectionTimeout: /Connection timed out|SocketTimeoutException|ConnectException/i,
    sqlException: /SQLException|SQL Exception|database error/i,
    classNotFound: /ClassNotFoundException|NoClassDefFoundError/i,
    threadDeadlock: /deadlock|BLOCKED|waiting for monitor/i,
    performanceIssue: /slow query|performance degradation|high cpu|high memory/i
  };

  const logLevelPatterns = {
    error: /\bERROR\b|\bFATAL\b|\bSEVERE\b/i,
    warning: /\bWARN\b|\bWARNING\b/i,
    info: /\bINFO\b/i,
    debug: /\bDEBUG\b|\bTRACE\b/i
  };

  lines.forEach((line, index) => {
    const timestamp = extractTimestamp(line);
    
    // Count log levels
    if (logLevelPatterns.error.test(line)) {
      analysis.summary.errorCount++;
      
      // Check for critical errors
      Object.entries(errorPatterns).forEach(([errorType, pattern]) => {
        if (pattern.test(line)) {
          const errorEntry = {
            lineNumber: index + 1,
            line: line.trim(),
            timestamp,
            type: errorType,
            stackTrace: extractStackTrace(lines, index)
          };
          
          analysis.patterns[errorType].push(errorEntry);
          
          if (['outOfMemory', 'nullPointer', 'threadDeadlock'].includes(errorType)) {
            analysis.summary.criticalErrors.push(errorEntry);
          }
        }
      });
    } else if (logLevelPatterns.warning.test(line)) {
      analysis.summary.warningCount++;
    } else if (logLevelPatterns.info.test(line)) {
      analysis.summary.infoCount++;
    } else if (logLevelPatterns.debug.test(line)) {
      analysis.summary.debugCount++;
    }

    // Build timeline
    if (timestamp && (logLevelPatterns.error.test(line) || logLevelPatterns.warning.test(line))) {
      analysis.timeline.push({
        timestamp,
        level: logLevelPatterns.error.test(line) ? 'ERROR' : 'WARNING',
        message: line.trim().substring(0, 200)
      });
    }
  });

  // Sort timeline by timestamp
  analysis.timeline.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

  // Generate recommendations based on findings
  analysis.recommendations = generateRecommendations(analysis);

  return analysis;
};

const extractTimestamp = (line) => {
  // Common timestamp patterns
  const patterns = [
    /(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2})/,
    /(\d{2}\/\d{2}\/\d{4}\s+\d{2}:\d{2}:\d{2})/,
    /(\d{4}\/\d{2}\/\d{2}\s+\d{2}:\d{2}:\d{2})/,
    /(\w{3}\s+\d{1,2},\s+\d{4}\s+\d{1,2}:\d{2}:\d{2}\s+[AP]M)/
  ];

  for (const pattern of patterns) {
    const match = line.match(pattern);
    if (match) {
      return match[1];
    }
  }
  return null;
};

const extractStackTrace = (lines, startIndex) => {
  const stackTrace = [];
  let i = startIndex + 1;
  
  while (i < lines.length && i < startIndex + 20) {
    const line = lines[i];
    if (line.match(/^\s*at\s+/) || line.match(/^\s*Caused by:/)) {
      stackTrace.push(line.trim());
    } else if (line.match(/^\s*\.\.\.\s*\d+\s*more/)) {
      stackTrace.push(line.trim());
      break;
    } else if (!line.trim() || !line.match(/^\s/)) {
      break;
    }
    i++;
  }
  
  return stackTrace;
};

const generateRecommendations = (analysis) => {
  const recommendations = [];

  if (analysis.patterns.outOfMemory.length > 0) {
    recommendations.push({
      severity: 'CRITICAL',
      category: 'Memory',
      issue: 'OutOfMemoryError detected',
      description: 'Your application is running out of heap memory',
      suggestions: [
        'Increase JVM heap size with -Xmx flag',
        'Analyze heap dump to find memory leaks',
        'Review code for objects not being garbage collected',
        'Consider using memory profiling tools like JProfiler or YourKit'
      ]
    });
  }

  if (analysis.patterns.nullPointer.length > 0) {
    recommendations.push({
      severity: 'HIGH',
      category: 'Code Quality',
      issue: 'NullPointerException found',
      description: 'Null reference errors indicate missing null checks',
      suggestions: [
        'Add null checks before object access',
        'Use Optional for nullable returns',
        'Initialize objects properly',
        'Consider using @NonNull/@Nullable annotations'
      ]
    });
  }

  if (analysis.patterns.connectionTimeout.length > 0) {
    recommendations.push({
      severity: 'HIGH',
      category: 'Network',
      issue: 'Connection timeouts detected',
      description: 'Network connectivity issues are affecting your application',
      suggestions: [
        'Increase connection timeout values',
        'Implement retry logic with exponential backoff',
        'Check network connectivity and firewall rules',
        'Add circuit breaker pattern for external services'
      ]
    });
  }

  if (analysis.patterns.threadDeadlock.length > 0) {
    recommendations.push({
      severity: 'CRITICAL',
      category: 'Concurrency',
      issue: 'Potential thread deadlock',
      description: 'Thread synchronization issues detected',
      suggestions: [
        'Review lock ordering to prevent circular dependencies',
        'Use concurrent collections instead of synchronized blocks',
        'Implement lock-free algorithms where possible',
        'Add deadlock detection and recovery mechanisms'
      ]
    });
  }

  if (analysis.summary.errorCount > 100) {
    recommendations.push({
      severity: 'MEDIUM',
      category: 'Logging',
      issue: 'High error rate',
      description: 'Excessive number of errors in logs',
      suggestions: [
        'Implement proper error handling and recovery',
        'Add monitoring and alerting for critical errors',
        'Review error patterns for common root causes',
        'Consider implementing a centralized logging solution'
      ]
    });
  }

  return recommendations;
};

const generateFixSuggestions = (analysis) => {
  const fixes = [];

  analysis.patterns.outOfMemory.forEach(error => {
    fixes.push({
      error: error,
      fixes: [
        {
          title: 'Increase Heap Memory',
          code: 'java -Xmx2g -Xms1g YourApplication',
          description: 'Start JVM with increased heap size'
        },
        {
          title: 'Enable Heap Dump on OOM',
          code: 'java -XX:+HeapDumpOnOutOfMemoryError -XX:HeapDumpPath=/path/to/dump YourApplication',
          description: 'Automatically create heap dump when OOM occurs'
        }
      ]
    });
  });

  analysis.patterns.nullPointer.forEach(error => {
    fixes.push({
      error: error,
      fixes: [
        {
          title: 'Add Null Check',
          code: `if (object != null) {
    object.method();
}`,
          description: 'Always check for null before accessing object'
        },
        {
          title: 'Use Optional',
          code: `Optional<Object> optional = Optional.ofNullable(object);
optional.ifPresent(obj -> obj.method());`,
          description: 'Use Optional for better null handling'
        }
      ]
    });
  });

  analysis.patterns.connectionTimeout.forEach(error => {
    fixes.push({
      error: error,
      fixes: [
        {
          title: 'Increase Timeout',
          code: `// For HttpClient
HttpClient client = HttpClient.newBuilder()
    .connectTimeout(Duration.ofSeconds(30))
    .build();`,
          description: 'Increase connection timeout duration'
        },
        {
          title: 'Add Retry Logic',
          code: `int maxRetries = 3;
for (int i = 0; i < maxRetries; i++) {
    try {
        // Your connection code
        break;
    } catch (TimeoutException e) {
        if (i == maxRetries - 1) throw e;
        Thread.sleep(1000 * (i + 1)); // Exponential backoff
    }
}`,
          description: 'Implement retry with exponential backoff'
        }
      ]
    });
  });

  return fixes;
};

module.exports = {
  analyzeJavaLogs,
  generateFixSuggestions
};