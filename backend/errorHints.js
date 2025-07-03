const getContextualHints = (errorType, errorMessage, context) => {
  const hints = {
    outOfMemory: {
      general: [
        {
          category: 'Immediate Actions',
          hints: [
            'Increase JVM heap size using -Xmx flag (e.g., -Xmx4g for 4GB)',
            'Generate heap dump for analysis: -XX:+HeapDumpOnOutOfMemoryError',
            'Check for memory leaks using profiling tools (JProfiler, YourKit, VisualVM)'
          ]
        },
        {
          category: 'Code Review',
          hints: [
            'Look for unclosed resources (streams, connections, readers)',
            'Check for large collections that grow unbounded',
            'Review static collections that accumulate data',
            'Ensure proper cleanup in finally blocks or try-with-resources'
          ]
        },
        {
          category: 'Common Causes',
          hints: [
            'Loading large files entirely into memory',
            'Caching without eviction policies',
            'Creating too many objects in loops',
            'String concatenation in loops (use StringBuilder)'
          ]
        }
      ],
      specific: {
        'PermGen space': [
          'Increase PermGen size: -XX:MaxPermSize=256m (Java 7 and below)',
          'For Java 8+, increase Metaspace: -XX:MaxMetaspaceSize=256m',
          'Check for classloader leaks in web applications',
          'Review dynamic class generation (proxies, reflection)'
        ],
        'GC overhead limit': [
          'JVM spending too much time in garbage collection',
          'Increase heap size or optimize object creation',
          'Consider using object pools for frequently created objects',
          'Profile to identify objects with high allocation rates'
        ]
      }
    },
    
    nullPointer: {
      general: [
        {
          category: 'Prevention Strategies',
          hints: [
            'Use Optional<T> for methods that might return null',
            'Add null checks before dereferencing objects',
            'Initialize all object fields in constructors',
            'Use @NonNull/@Nullable annotations with static analysis tools'
          ]
        },
        {
          category: 'Debugging Steps',
          hints: [
            'Check the exact line number in the stack trace',
            'Identify which variable is null using debugger',
            'Trace back to where the variable should have been initialized',
            'Look for race conditions in multi-threaded code'
          ]
        },
        {
          category: 'Best Practices',
          hints: [
            'Follow "fail-fast" principle - validate inputs early',
            'Use defensive programming: assume inputs might be null',
            'Prefer empty collections over null',
            'Use Objects.requireNonNull() for parameter validation'
          ]
        }
      ],
      specific: {
        'at java.util.': [
          'Collection operation on null collection',
          'Initialize collections at declaration: List<String> list = new ArrayList<>()',
          'Use Collections.emptyList() instead of null',
          'Check collection initialization in all code paths'
        ],
        'getClass()': [
          'Calling methods on null object reference',
          'Object was not properly instantiated',
          'Check constructor calls and factory methods',
          'Verify dependency injection configuration'
        ]
      }
    },
    
    connectionTimeout: {
      general: [
        {
          category: 'Network Configuration',
          hints: [
            'Increase connection timeout values appropriately',
            'Implement retry logic with exponential backoff',
            'Use connection pooling to reuse connections',
            'Configure keep-alive settings for long-running connections'
          ]
        },
        {
          category: 'Infrastructure Review',
          hints: [
            'Check firewall rules between services',
            'Verify DNS resolution is working correctly',
            'Monitor network latency and packet loss',
            'Check if target service is healthy and responsive'
          ]
        },
        {
          category: 'Code Improvements',
          hints: [
            'Implement circuit breaker pattern for external services',
            'Add connection and read timeout configurations',
            'Use asynchronous calls for non-critical operations',
            'Implement proper timeout handling and fallbacks'
          ]
        }
      ],
      specific: {
        'Connection refused': [
          'Target service is not running or not listening on the port',
          'Check if the service URL and port are correct',
          'Verify the service is started and healthy',
          'Check for port conflicts or binding issues'
        ],
        'Read timed out': [
          'Server is accepting connections but not responding',
          'Increase read timeout: setReadTimeout(30000)',
          'Check if server is under heavy load',
          'Verify the endpoint is functioning correctly'
        ]
      }
    },
    
    sqlExceptions: {
      general: [
        {
          category: 'Database Connectivity',
          hints: [
            'Verify database connection string and credentials',
            'Check database server is running and accessible',
            'Configure connection pool properly (min/max connections)',
            'Implement connection validation queries'
          ]
        },
        {
          category: 'Query Optimization',
          hints: [
            'Review slow queries using database profiler',
            'Add appropriate indexes for frequently queried columns',
            'Use prepared statements to prevent SQL injection',
            'Implement query timeout settings'
          ]
        },
        {
          category: 'Transaction Management',
          hints: [
            'Ensure proper transaction boundaries',
            'Handle deadlocks with retry logic',
            'Use appropriate isolation levels',
            'Close connections/statements in finally blocks'
          ]
        }
      ],
      specific: {
        'constraint violation': [
          'Unique constraint or foreign key violation',
          'Check for duplicate data before insert',
          'Verify foreign key references exist',
          'Review cascade delete settings'
        ],
        'syntax error': [
          'SQL query has syntax errors',
          'Validate SQL queries before deployment',
          'Use query builders or ORMs to prevent syntax issues',
          'Check for database version compatibility'
        ],
        'too many connections': [
          'Connection pool exhausted or database connection limit reached',
          'Increase max connections in database and pool',
          'Check for connection leaks (not closing connections)',
          'Monitor connection pool metrics'
        ]
      }
    },
    
    authenticationErrors: {
      general: [
        {
          category: 'Credential Management',
          hints: [
            'Verify username and password are correct',
            'Check if credentials have expired',
            'Ensure proper encoding of special characters',
            'Use secure credential storage (not hardcoded)'
          ]
        },
        {
          category: 'Security Configuration',
          hints: [
            'Review authentication mechanism (Basic, OAuth, JWT)',
            'Check token expiration and refresh logic',
            'Verify SSL/TLS certificates are valid',
            'Ensure proper CORS configuration for web apps'
          ]
        },
        {
          category: 'Access Control',
          hints: [
            'Verify user has required permissions/roles',
            'Check if account is locked or disabled',
            'Review IP whitelisting or geographic restrictions',
            'Validate session management implementation'
          ]
        }
      ],
      specific: {
        '401': [
          'Authentication required or credentials invalid',
          'Add proper authentication headers',
          'Check if token/session has expired',
          'Verify API key or credentials are correct'
        ],
        '403': [
          'Authenticated but not authorized for resource',
          'Check user roles and permissions',
          'Verify resource access policies',
          'Review API rate limiting'
        ]
      }
    },
    
    configurationErrors: {
      general: [
        {
          category: 'Configuration Management',
          hints: [
            'Validate all configuration files at startup',
            'Use configuration schemas for validation',
            'Implement fallback/default configurations',
            'Separate environment-specific configurations'
          ]
        },
        {
          category: 'Property Resolution',
          hints: [
            'Check property file locations and classpath',
            'Verify environment variables are set',
            'Use consistent naming conventions',
            'Document all required configuration properties'
          ]
        },
        {
          category: 'Dependency Injection',
          hints: [
            'Verify all beans can be instantiated',
            'Check for circular dependencies',
            'Ensure proper component scanning',
            'Review @Autowired/@Inject annotations'
          ]
        }
      ],
      specific: {
        'Missing property': [
          'Required configuration property not found',
          'Add missing property to configuration file',
          'Check property name spelling and case',
          'Verify property file is loaded correctly'
        ],
        'Bean creation': [
          'Spring/DI container cannot create bean',
          'Check constructor parameters availability',
          'Verify all dependencies are available',
          'Review bean initialization order'
        ]
      }
    },
    
    ioExceptions: {
      general: [
        {
          category: 'File Operations',
          hints: [
            'Check file/directory permissions',
            'Verify file paths are correct and accessible',
            'Ensure sufficient disk space',
            'Use try-with-resources for automatic cleanup'
          ]
        },
        {
          category: 'Resource Management',
          hints: [
            'Close all streams, readers, and writers properly',
            'Handle file locking appropriately',
            'Implement proper error recovery',
            'Use buffered I/O for better performance'
          ]
        },
        {
          category: 'Network I/O',
          hints: [
            'Handle connection interruptions gracefully',
            'Implement timeouts for network operations',
            'Use non-blocking I/O for scalability',
            'Add retry logic for transient failures'
          ]
        }
      ],
      specific: {
        'FileNotFoundException': [
          'File does not exist at specified path',
          'Verify file path is correct',
          'Check if file was moved or deleted',
          'Ensure application has read permissions'
        ],
        'Permission denied': [
          'Insufficient permissions to access resource',
          'Check file/directory permissions',
          'Run application with appropriate user',
          'Verify SELinux or AppArmor policies'
        ]
      }
    },
    
    threadDeadlock: {
      general: [
        {
          category: 'Deadlock Prevention',
          hints: [
            'Always acquire locks in the same order',
            'Use tryLock() with timeout instead of lock()',
            'Minimize the scope of synchronized blocks',
            'Avoid nested locks when possible'
          ]
        },
        {
          category: 'Concurrency Patterns',
          hints: [
            'Use java.util.concurrent utilities',
            'Prefer lock-free data structures',
            'Implement deadlock detection mechanisms',
            'Use thread-safe collections'
          ]
        },
        {
          category: 'Debugging',
          hints: [
            'Generate thread dump during deadlock',
            'Use jstack or kill -3 to analyze threads',
            'Review lock acquisition patterns',
            'Use profiling tools to detect lock contention'
          ]
        }
      ],
      specific: {
        'waiting for monitor': [
          'Thread blocked waiting for lock',
          'Identify circular lock dependencies',
          'Refactor to eliminate lock ordering issues',
          'Consider using ReentrantLock with fairness'
        ]
      }
    },
    
    performanceIssues: {
      general: [
        {
          category: 'Performance Profiling',
          hints: [
            'Use profiling tools to identify bottlenecks',
            'Monitor CPU, memory, and I/O usage',
            'Analyze garbage collection logs',
            'Review database query performance'
          ]
        },
        {
          category: 'Code Optimization',
          hints: [
            'Cache frequently accessed data',
            'Use appropriate data structures',
            'Implement pagination for large datasets',
            'Optimize algorithms complexity (O(n) vs O(n²))'
          ]
        },
        {
          category: 'System Tuning',
          hints: [
            'Tune JVM parameters for your workload',
            'Configure thread pool sizes appropriately',
            'Use connection pooling for external resources',
            'Consider horizontal scaling'
          ]
        }
      ],
      specific: {
        'slow query': [
          'Database query taking too long',
          'Add indexes on frequently queried columns',
          'Optimize query execution plan',
          'Consider query result caching'
        ],
        'high cpu': [
          'Excessive CPU utilization',
          'Profile to find CPU-intensive methods',
          'Optimize tight loops and algorithms',
          'Check for infinite loops or busy waiting'
        ]
      }
    }
  };
  
  // Get base hints for error type
  const errorHints = hints[errorType] || hints.general;
  
  // Find specific hints based on error message
  let specificHints = [];
  if (errorHints && errorHints.specific) {
    for (const [pattern, hints] of Object.entries(errorHints.specific)) {
      if (errorMessage && errorMessage.toLowerCase().includes(pattern.toLowerCase())) {
        specificHints = hints;
        break;
      }
    }
  }
  
  return {
    general: errorHints?.general || [],
    specific: specificHints,
    contextual: generateContextualHints(errorType, context)
  };
};

const generateContextualHints = (errorType, context) => {
  const hints = [];
  
  if (context?.thread) {
    if (context.thread.includes('pool') || context.thread.includes('thread-')) {
      hints.push('Error occurred in a thread pool - check thread pool configuration');
      hints.push('Ensure proper exception handling in runnable/callable tasks');
    }
    if (context.thread.includes('http') || context.thread.includes('nio')) {
      hints.push('Error in HTTP request handler - check request processing');
      hints.push('Verify request parameters and headers');
    }
  }
  
  if (context?.class) {
    if (context.class.includes('Controller') || context.class.includes('Resource')) {
      hints.push('Error in REST endpoint - validate input parameters');
      hints.push('Check request/response serialization');
    }
    if (context.class.includes('Repository') || context.class.includes('DAO')) {
      hints.push('Database layer error - check query and connection');
      hints.push('Verify entity mappings and transactions');
    }
    if (context.class.includes('Service')) {
      hints.push('Business logic error - review service method implementation');
      hints.push('Check for proper error handling and validation');
    }
  }
  
  return hints;
};

const generateQuickFixes = (errorType, errorEntry) => {
  const quickFixes = {
    outOfMemory: [
      {
        title: 'JVM Memory Settings',
        commands: [
          'java -Xmx4g -Xms2g -XX:+UseG1GC YourApp',
          'java -XX:+HeapDumpOnOutOfMemoryError -XX:HeapDumpPath=/tmp/heapdump.hprof YourApp'
        ],
        description: 'Increase heap memory and enable heap dump on OOM'
      },
      {
        title: 'Memory Analysis Commands',
        commands: [
          'jmap -heap <pid>',
          'jmap -histo:live <pid> | head -20',
          'jcmd <pid> GC.class_histogram'
        ],
        description: 'Commands to analyze memory usage'
      }
    ],
    
    nullPointer: [
      {
        title: 'Defensive Null Checks',
        commands: [],
        code: `// Before
String value = object.getValue();

// After - Option 1: Explicit null check
if (object != null) {
    String value = object.getValue();
}

// After - Option 2: Using Optional
Optional.ofNullable(object)
    .map(Object::getValue)
    .orElse("default");

// After - Option 3: Using Objects utility
String value = Objects.requireNonNullElse(
    object != null ? object.getValue() : null, 
    "default"
);`
      }
    ],
    
    connectionTimeout: [
      {
        title: 'HTTP Client Configuration',
        code: `// Java 11+ HttpClient
HttpClient client = HttpClient.newBuilder()
    .connectTimeout(Duration.ofSeconds(10))
    .build();

HttpRequest request = HttpRequest.newBuilder()
    .uri(URI.create("https://api.example.com"))
    .timeout(Duration.ofSeconds(30))
    .build();

// Apache HttpClient
RequestConfig config = RequestConfig.custom()
    .setConnectTimeout(10000)
    .setSocketTimeout(30000)
    .build();`
      },
      {
        title: 'Retry Logic Implementation',
        code: `@Retryable(
    value = {ConnectException.class, SocketTimeoutException.class},
    maxAttempts = 3,
    backoff = @Backoff(delay = 1000, multiplier = 2)
)
public String callExternalService() {
    // Your code here
}`
      }
    ],
    
    sqlExceptions: [
      {
        title: 'Connection Pool Configuration',
        code: `# HikariCP Configuration
spring.datasource.hikari.connection-timeout=30000
spring.datasource.hikari.maximum-pool-size=10
spring.datasource.hikari.minimum-idle=5
spring.datasource.hikari.idle-timeout=600000
spring.datasource.hikari.max-lifetime=1800000
spring.datasource.hikari.validation-query=SELECT 1`
      },
      {
        title: 'Transaction Management',
        code: `@Transactional(
    propagation = Propagation.REQUIRED,
    isolation = Isolation.READ_COMMITTED,
    timeout = 30,
    rollbackFor = Exception.class
)
public void performDatabaseOperation() {
    // Your database operations
}`
      }
    ]
  };
  
  return quickFixes[errorType] || [];
};

module.exports = {
  getContextualHints,
  generateQuickFixes
};