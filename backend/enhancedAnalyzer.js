const { getContextualHints, generateQuickFixes } = require('./errorHints');

const generateEnhancedFixSuggestions = (analysis) => {
  const enhancedFixes = [];
  const processedErrors = new Map();
  
  // Process all error patterns
  Object.entries(analysis.patterns).forEach(([errorType, errors]) => {
    if (errors.length === 0) return;
    
    // Group similar errors
    errors.forEach(error => {
      const key = `${errorType}-${error.type}`;
      if (!processedErrors.has(key)) {
        processedErrors.set(key, {
          type: errorType,
          errors: [],
          firstOccurrence: error.lineNumber,
          count: 0
        });
      }
      const group = processedErrors.get(key);
      group.errors.push(error);
      group.count++;
      group.lastOccurrence = error.lineNumber;
    });
  });
  
  // Generate enhanced fixes for each error group
  processedErrors.forEach((group, key) => {
    const sampleError = group.errors[0];
    const hints = getContextualHints(group.type, sampleError.line, sampleError.context);
    const quickFixes = generateQuickFixes(group.type, sampleError);
    
    enhancedFixes.push({
      errorType: group.type,
      errorCount: group.count,
      lineRange: `${group.firstOccurrence}-${group.lastOccurrence || group.firstOccurrence}`,
      sampleError: {
        line: sampleError.line,
        lineNumber: sampleError.lineNumber,
        stackTrace: sampleError.stackTrace.slice(0, 5)
      },
      hints: hints,
      quickFixes: quickFixes,
      priority: calculatePriority(group.type, group.count)
    });
  });
  
  // Sort by priority
  enhancedFixes.sort((a, b) => b.priority - a.priority);
  
  return enhancedFixes;
};

const calculatePriority = (errorType, count) => {
  const basePriority = {
    outOfMemory: 100,
    threadDeadlock: 95,
    securityExceptions: 90,
    authenticationErrors: 85,
    nullPointer: 80,
    sqlExceptions: 75,
    connectionTimeout: 70,
    configurationErrors: 65,
    ioExceptions: 60,
    performanceIssues: 55,
    concurrentModification: 50,
    indexOutOfBounds: 45,
    illegalArgument: 40,
    illegalState: 35
  };
  
  const base = basePriority[errorType] || 30;
  const countBonus = Math.min(count * 2, 20); // Max 20 points for frequency
  
  return base + countBonus;
};

const generateResolutionSteps = (analysis) => {
  const steps = [];
  const criticalErrors = analysis.summary.criticalErrors;
  
  if (criticalErrors.length > 0) {
    steps.push({
      step: 1,
      title: 'Address Critical Errors First',
      description: 'Fix critical errors that can cause system failure',
      errors: criticalErrors.map(e => ({
        type: e.type,
        line: e.lineNumber,
        impact: 'System Failure'
      }))
    });
  }
  
  if (analysis.summary.topErrors.length > 0) {
    const highFrequencyErrors = analysis.summary.topErrors
      .filter(e => e.count > 10)
      .slice(0, 5);
      
    if (highFrequencyErrors.length > 0) {
      steps.push({
        step: steps.length + 1,
        title: 'Fix High-Frequency Errors',
        description: 'Address errors that occur most frequently',
        errors: highFrequencyErrors.map(e => ({
          message: e.message,
          count: e.count,
          percentage: e.percentage
        }))
      });
    }
  }
  
  // Add performance-related fixes
  if (analysis.patterns.performanceIssues.length > 0) {
    steps.push({
      step: steps.length + 1,
      title: 'Optimize Performance Issues',
      description: 'Improve system performance and response times',
      actions: [
        'Profile slow queries and optimize them',
        'Review memory usage patterns',
        'Check for inefficient algorithms',
        'Consider caching strategies'
      ]
    });
  }
  
  // Add security-related fixes
  const securityIssues = [
    ...analysis.patterns.authenticationErrors || [],
    ...analysis.patterns.securityExceptions || []
  ];
  
  if (securityIssues.length > 0) {
    steps.push({
      step: steps.length + 1,
      title: 'Resolve Security Issues',
      description: 'Fix authentication and authorization problems',
      actions: [
        'Review authentication configuration',
        'Check access control policies',
        'Validate certificate configurations',
        'Implement proper error handling for security failures'
      ]
    });
  }
  
  return steps;
};

const generateErrorSummaryReport = (analysis, detailedAnalysis) => {
  const report = {
    executive: {
      totalErrors: analysis.summary.errorCount,
      totalWarnings: analysis.summary.warningCount,
      criticalIssues: analysis.summary.criticalErrors.length,
      uniqueErrorTypes: detailedAnalysis.errorSummary.totalUniqueErrors,
      healthScore: calculateHealthScore(analysis),
      recommendations: []
    },
    technical: {
      topIssues: [],
      timePatterns: [],
      affectedComponents: []
    }
  };
  
  // Add executive recommendations
  if (report.executive.healthScore < 50) {
    report.executive.recommendations.push('URGENT: System health is critical. Immediate action required.');
  }
  
  if (analysis.summary.criticalErrors.length > 0) {
    report.executive.recommendations.push('Address critical errors to prevent system failures');
  }
  
  if (detailedAnalysis.timeAnalysis.peakErrorHours.length > 0) {
    const peakHour = detailedAnalysis.timeAnalysis.peakErrorHours[0];
    report.executive.recommendations.push(
      `Investigate high error rate at ${peakHour.hour}:00 (${peakHour.count} errors)`
    );
  }
  
  // Add technical details
  report.technical.topIssues = detailedAnalysis.errorSummary.mostFrequentErrors
    .slice(0, 5)
    .map(e => ({
      error: e.message,
      occurrences: e.count,
      impact: assessImpact(e.message, e.count)
    }));
    
  report.technical.affectedComponents = identifyAffectedComponents(analysis);
  
  return report;
};

const calculateHealthScore = (analysis) => {
  const totalLogs = analysis.summary.totalLines;
  const errors = analysis.summary.errorCount;
  const warnings = analysis.summary.warningCount;
  const critical = analysis.summary.criticalErrors.length;
  
  if (totalLogs === 0) return 100;
  
  const errorRate = (errors / totalLogs) * 100;
  const warningRate = (warnings / totalLogs) * 100;
  
  let score = 100;
  score -= errorRate * 10; // Each 1% error rate reduces score by 10
  score -= warningRate * 2;  // Each 1% warning rate reduces score by 2
  score -= critical * 15;    // Each critical error reduces score by 15
  
  return Math.max(0, Math.round(score));
};

const assessImpact = (errorMessage, count) => {
  if (errorMessage.includes('OutOfMemory') || errorMessage.includes('deadlock')) {
    return 'CRITICAL - Can cause system failure';
  }
  if (errorMessage.includes('SQL') || errorMessage.includes('Database')) {
    return 'HIGH - Affects data integrity';
  }
  if (errorMessage.includes('Connection') || errorMessage.includes('timeout')) {
    return 'MEDIUM - Affects system availability';
  }
  if (count > 100) {
    return 'HIGH - Very frequent occurrence';
  }
  if (count > 50) {
    return 'MEDIUM - Frequent occurrence';
  }
  return 'LOW - Occasional issue';
};

const identifyAffectedComponents = (analysis) => {
  const components = new Map();
  
  // Analyze contextual errors for component information
  if (analysis.contextualErrors) {
    analysis.contextualErrors.forEach(error => {
      if (error.context?.class) {
        const component = categorizeComponent(error.context.class);
        if (!components.has(component)) {
          components.set(component, { name: component, errorCount: 0, types: new Set() });
        }
        const comp = components.get(component);
        comp.errorCount++;
        comp.types.add(error.type);
      }
    });
  }
  
  return Array.from(components.values()).map(c => ({
    name: c.name,
    errorCount: c.errorCount,
    errorTypes: Array.from(c.types)
  })).sort((a, b) => b.errorCount - a.errorCount);
};

const categorizeComponent = (className) => {
  if (className.includes('Controller') || className.includes('Resource')) return 'REST API Layer';
  if (className.includes('Service')) return 'Business Logic Layer';
  if (className.includes('Repository') || className.includes('DAO')) return 'Data Access Layer';
  if (className.includes('Security') || className.includes('Auth')) return 'Security Layer';
  if (className.includes('Config')) return 'Configuration Layer';
  if (className.includes('Util') || className.includes('Helper')) return 'Utility Layer';
  return 'Application Layer';
};

module.exports = {
  generateEnhancedFixSuggestions,
  generateResolutionSteps,
  generateErrorSummaryReport
};