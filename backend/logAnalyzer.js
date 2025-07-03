const analyzeJavaLogs = async (logContent) => {
  const lines = logContent.split('\n');
  const analysis = {
    summary: {
      totalLines: lines.length,
      errorCount: 0,
      warningCount: 0,
      infoCount: 0,
      debugCount: 0,
      criticalErrors: [],
      errorsByType: {},
      warningsByType: {},
      topErrors: [],
      topWarnings: [],
      errorDistributionByHour: {}
    },
    patterns: {
      outOfMemory: [],
      nullPointer: [],
      connectionTimeout: [],
      sqlExceptions: [],
      classNotFound: [],
      threadDeadlock: [],
      performanceIssues: [],
      authenticationErrors: [],
      configurationErrors: [],
      ioExceptions: [],
      securityExceptions: [],
      concurrentModification: [],
      indexOutOfBounds: [],
      illegalArgument: [],
      illegalState: []
    },
    timeline: [],
    recommendations: [],
    errorFrequency: {},
    warningFrequency: {},
    contextualErrors: []
  };

  const errorPatterns = {
    outOfMemory: /OutOfMemoryError|java\.lang\.OutOfMemoryError|heap space|GC overhead limit/i,
    nullPointer: /NullPointerException|java\.lang\.NullPointerException/i,
    connectionTimeout: /Connection timed out|SocketTimeoutException|ConnectException|Connection refused/i,
    sqlExceptions: /SQLException|SQL Exception|database error|constraint violation|duplicate entry/i,
    classNotFound: /ClassNotFoundException|NoClassDefFoundError/i,
    threadDeadlock: /deadlock|BLOCKED|waiting for monitor|Found one Java-level deadlock/i,
    performanceIssues: /slow query|performance degradation|high cpu|high memory|took \d{4,}ms/i,
    authenticationErrors: /Authentication failed|Unauthorized|Access denied|Invalid credentials|403|401/i,
    configurationErrors: /Configuration error|Missing property|Invalid configuration|Bean creation exception/i,
    ioExceptions: /IOException|FileNotFoundException|Broken pipe|Connection reset/i,
    securityExceptions: /SecurityException|Access control|Permission denied/i,
    concurrentModification: /ConcurrentModificationException/i,
    indexOutOfBounds: /IndexOutOfBoundsException|ArrayIndexOutOfBoundsException/i,
    illegalArgument: /IllegalArgumentException/i,
    illegalState: /IllegalStateException/i
  };

  const logLevelPatterns = {
    error: /\bERROR\b|\bFATAL\b|\bSEVERE\b/i,
    warning: /\bWARN\b|\bWARNING\b/i,
    info: /\bINFO\b/i,
    debug: /\bDEBUG\b|\bTRACE\b/i
  };

  lines.forEach((line, index) => {
    const timestamp = extractTimestamp(line);
    const hour = timestamp ? new Date(timestamp).getHours() : null;
    
    // Count log levels
    if (logLevelPatterns.error.test(line)) {
      analysis.summary.errorCount++;
      
      // Track error distribution by hour
      if (hour !== null) {
        analysis.summary.errorDistributionByHour[hour] = 
          (analysis.summary.errorDistributionByHour[hour] || 0) + 1;
      }
      
      // Extract error message for frequency analysis
      const errorMessage = extractErrorMessage(line);
      if (errorMessage) {
        analysis.errorFrequency[errorMessage] = 
          (analysis.errorFrequency[errorMessage] || 0) + 1;
        
        // Track error types
        const errorType = classifyErrorType(errorMessage);
        analysis.summary.errorsByType[errorType] = 
          (analysis.summary.errorsByType[errorType] || 0) + 1;
      }
      
      // Check for specific error patterns
      Object.entries(errorPatterns).forEach(([errorType, pattern]) => {
        if (pattern.test(line)) {
          const errorEntry = {
            lineNumber: index + 1,
            line: line.trim(),
            timestamp,
            type: errorType,
            stackTrace: extractStackTrace(lines, index),
            context: extractContext(lines, index)
          };
          
          analysis.patterns[errorType].push(errorEntry);
          
          if (['outOfMemory', 'nullPointer', 'threadDeadlock', 'securityExceptions'].includes(errorType)) {
            analysis.summary.criticalErrors.push(errorEntry);
          }
          
          // Add to contextual errors with surrounding context
          analysis.contextualErrors.push({
            ...errorEntry,
            previousLines: extractPreviousLines(lines, index, 3),
            followingLines: extractFollowingLines(lines, index, 3)
          });
        }
      });
    } else if (logLevelPatterns.warning.test(line)) {
      analysis.summary.warningCount++;
      
      // Extract warning message for frequency analysis
      const warningMessage = extractErrorMessage(line);
      if (warningMessage) {
        analysis.warningFrequency[warningMessage] = 
          (analysis.warningFrequency[warningMessage] || 0) + 1;
        
        // Track warning types
        const warningType = classifyErrorType(warningMessage);
        analysis.summary.warningsByType[warningType] = 
          (analysis.summary.warningsByType[warningType] || 0) + 1;
      }
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
  
  // Calculate top errors and warnings
  analysis.summary.topErrors = Object.entries(analysis.errorFrequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([message, count]) => ({ message, count, percentage: (count / analysis.summary.errorCount * 100).toFixed(1) }));
  
  analysis.summary.topWarnings = Object.entries(analysis.warningFrequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([message, count]) => ({ message, count, percentage: (count / analysis.summary.warningCount * 100).toFixed(1) }));

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
  
  while (i < lines.length && i < startIndex + 50) {
    const line = lines[i];
    if (line.match(/^\s*at\s+/) || line.match(/^\s*Caused by:/) || line.match(/^\s*Suppressed:/)) {
      stackTrace.push(line.trim());
    } else if (line.match(/^\s*\.\.\.\s*\d+\s*more/)) {
      stackTrace.push(line.trim());
      break;
    } else if (!line.trim() || (!line.match(/^\s/) && !line.match(/^\t/))) {
      break;
    }
    i++;
  }
  
  return stackTrace;
};

const extractErrorMessage = (line) => {
  // Remove timestamp and log level
  let message = line.replace(/^\[?[\d\-\s:\.TZ]+\]?\s*/, '');
  message = message.replace(/^(ERROR|WARN|INFO|DEBUG|TRACE|FATAL|SEVERE|WARNING)\s*[-:]?\s*/i, '');
  
  // Remove thread info
  message = message.replace(/^\[[^\]]+\]\s*/, '');
  
  // Remove logger name
  message = message.replace(/^[\w\.]+\s*[-:]\s*/, '');
  
  // Extract core error message
  const exceptionMatch = message.match(/([\w\.]*Exception|[\w\.]*Error):\s*(.+)/i);
  if (exceptionMatch) {
    return `${exceptionMatch[1]}: ${exceptionMatch[2].trim()}`;
  }
  
  return message.trim();
};

const classifyErrorType = (message) => {
  if (message.match(/NullPointer/i)) return 'NullPointer';
  if (message.match(/OutOfMemory|heap/i)) return 'Memory';
  if (message.match(/SQL|database|constraint/i)) return 'Database';
  if (message.match(/Connection|Socket|timeout/i)) return 'Network';
  if (message.match(/File|IO|stream/i)) return 'IO';
  if (message.match(/Security|Authentication|Authorization/i)) return 'Security';
  if (message.match(/Configuration|property|bean/i)) return 'Configuration';
  if (message.match(/Thread|deadlock|concurrent/i)) return 'Concurrency';
  if (message.match(/Index|Array|bounds/i)) return 'IndexBounds';
  if (message.match(/Illegal|Invalid/i)) return 'Validation';
  return 'Other';
};

const extractContext = (lines, errorIndex) => {
  const context = {
    method: null,
    class: null,
    thread: null
  };
  
  // Extract from error line
  const errorLine = lines[errorIndex];
  const threadMatch = errorLine.match(/\[([^\]]+)\]/);;
  if (threadMatch) context.thread = threadMatch[1];
  
  // Look for method/class in stack trace
  if (errorIndex + 1 < lines.length) {
    const firstStackLine = lines[errorIndex + 1];
    const atMatch = firstStackLine.match(/at\s+([\w\.]+)\.([\w<>$]+)\(/);;
    if (atMatch) {
      context.class = atMatch[1];
      context.method = atMatch[2];
    }
  }
  
  return context;
};

const extractPreviousLines = (lines, index, count) => {
  const start = Math.max(0, index - count);
  return lines.slice(start, index).map((line, i) => ({
    lineNumber: start + i + 1,
    content: line
  }));
};

const extractFollowingLines = (lines, index, count) => {
  const end = Math.min(lines.length, index + count + 1);
  return lines.slice(index + 1, end).map((line, i) => ({
    lineNumber: index + i + 2,
    content: line
  }));
};

const generateRecommendations = (analysis) => {
  const recommendations = [];
  
  // Add frequency-based recommendations
  if (analysis.summary.topErrors.length > 0 && analysis.summary.topErrors[0].count > 10) {
    recommendations.push({
      severity: 'HIGH',
      category: 'Error Patterns',
      issue: 'Frequently occurring errors detected',
      description: `The error "${analysis.summary.topErrors[0].message}" occurs ${analysis.summary.topErrors[0].count} times (${analysis.summary.topErrors[0].percentage}% of all errors)`,
      suggestions: [
        'Prioritize fixing this frequently occurring error',
        'Look for common patterns in the stack traces',
        'Consider adding specific error handling for this case',
        'Review recent code changes that might have introduced this error'
      ]
    });
  }
  
  // Check error distribution by hour
  const peakHours = Object.entries(analysis.summary.errorDistributionByHour)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);
  
  if (peakHours.length > 0 && peakHours[0][1] > analysis.summary.errorCount * 0.2) {
    recommendations.push({
      severity: 'MEDIUM',
      category: 'Time Patterns',
      issue: 'Errors concentrated during specific hours',
      description: `Most errors occur during hours: ${peakHours.map(([h, c]) => `${h}:00 (${c} errors)`).join(', ')}`,
      suggestions: [
        'Investigate what happens during these peak hours',
        'Check for scheduled jobs or batch processes',
        'Monitor system resources during these times',
        'Consider load balancing or scaling during peak hours'
      ]
    });
  }

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
  
  if (analysis.patterns.authenticationErrors.length > 0) {
    recommendations.push({
      severity: 'HIGH',
      category: 'Security',
      issue: 'Authentication failures detected',
      description: 'Multiple authentication errors found in logs',
      suggestions: [
        'Review authentication configuration',
        'Check for expired certificates or credentials',
        'Implement proper retry logic with backoff',
        'Monitor for potential security attacks',
        'Review user permissions and access controls'
      ]
    });
  }
  
  if (analysis.patterns.configurationErrors.length > 0) {
    recommendations.push({
      severity: 'HIGH',
      category: 'Configuration',
      issue: 'Configuration errors detected',
      description: 'Application configuration issues found',
      suggestions: [
        'Validate all configuration files',
        'Check for missing required properties',
        'Review environment-specific configurations',
        'Implement configuration validation on startup',
        'Consider using a configuration management system'
      ]
    });
  }
  
  if (analysis.patterns.ioExceptions.length > 0) {
    recommendations.push({
      severity: 'MEDIUM',
      category: 'IO Operations',
      issue: 'IO exceptions detected',
      description: 'File or network IO operations are failing',
      suggestions: [
        'Check file permissions and paths',
        'Verify disk space availability',
        'Implement proper resource cleanup (try-with-resources)',
        'Add retry logic for transient IO failures',
        'Monitor file system and network health'
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

const { getContextualHints, generateQuickFixes } = require('./errorHints');

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

const generateDetailedAnalysis = (analysis) => {
  const detailed = {
    errorSummary: {
      totalUniqueErrors: Object.keys(analysis.errorFrequency).length,
      mostFrequentErrors: analysis.summary.topErrors,
      errorCategories: Object.entries(analysis.summary.errorsByType)
        .sort((a, b) => b[1] - a[1])
        .map(([type, count]) => ({
          type,
          count,
          percentage: (count / analysis.summary.errorCount * 100).toFixed(1)
        }))
    },
    warningSummary: {
      totalUniqueWarnings: Object.keys(analysis.warningFrequency).length,
      mostFrequentWarnings: analysis.summary.topWarnings,
      warningCategories: Object.entries(analysis.summary.warningsByType)
        .sort((a, b) => b[1] - a[1])
        .map(([type, count]) => ({
          type,
          count,
          percentage: (count / analysis.summary.warningCount * 100).toFixed(1)
        }))
    },
    timeAnalysis: {
      errorsByHour: Object.entries(analysis.summary.errorDistributionByHour)
        .map(([hour, count]) => ({ hour: parseInt(hour), count }))
        .sort((a, b) => a.hour - b.hour),
      peakErrorHours: Object.entries(analysis.summary.errorDistributionByHour)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([hour, count]) => ({ hour: parseInt(hour), count }))
    },
    patternSummary: Object.entries(analysis.patterns)
      .filter(([_, errors]) => errors.length > 0)
      .map(([pattern, errors]) => ({
        pattern,
        count: errors.length,
        firstOccurrence: errors[0]?.lineNumber,
        lastOccurrence: errors[errors.length - 1]?.lineNumber
      }))
      .sort((a, b) => b.count - a.count)
  };
  
  return detailed;
};

module.exports = {
  analyzeJavaLogs,
  generateFixSuggestions,
  generateDetailedAnalysis
};