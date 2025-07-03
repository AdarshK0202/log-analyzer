export interface LogAnalysis {
  summary: {
    totalLines: number;
    errorCount: number;
    warningCount: number;
    infoCount: number;
    debugCount: number;
    criticalErrors: ErrorEntry[];
    errorsByType?: Record<string, number>;
    warningsByType?: Record<string, number>;
    topErrors?: FrequencyItem[];
    topWarnings?: FrequencyItem[];
    errorDistributionByHour?: Record<string, number>;
  };
  patterns: {
    outOfMemory: ErrorEntry[];
    nullPointer: ErrorEntry[];
    connectionTimeout: ErrorEntry[];
    sqlExceptions: ErrorEntry[];
    classNotFound: ErrorEntry[];
    threadDeadlock: ErrorEntry[];
    performanceIssues: ErrorEntry[];
    authenticationErrors?: ErrorEntry[];
    configurationErrors?: ErrorEntry[];
    ioExceptions?: ErrorEntry[];
    securityExceptions?: ErrorEntry[];
    concurrentModification?: ErrorEntry[];
    indexOutOfBounds?: ErrorEntry[];
    illegalArgument?: ErrorEntry[];
    illegalState?: ErrorEntry[];
  };
  timeline: TimelineEntry[];
  recommendations: Recommendation[];
  errorFrequency?: Record<string, number>;
  warningFrequency?: Record<string, number>;
  contextualErrors?: ContextualError[];
}

export interface ErrorEntry {
  lineNumber: number;
  line: string;
  timestamp: string | null;
  type: string;
  stackTrace: string[];
  context?: {
    method: string | null;
    class: string | null;
    thread: string | null;
  };
}

export interface TimelineEntry {
  timestamp: string;
  level: 'ERROR' | 'WARNING';
  message: string;
}

export interface Recommendation {
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  category: string;
  issue: string;
  description: string;
  suggestions: string[];
}

export interface FixSuggestion {
  error: ErrorEntry;
  fixes: Fix[];
}

export interface Fix {
  title: string;
  code: string;
  description: string;
}

export interface FrequencyItem {
  message: string;
  count: number;
  percentage: string;
}

export interface ContextualError extends ErrorEntry {
  previousLines: { lineNumber: number; content: string }[];
  followingLines: { lineNumber: number; content: string }[];
}

export interface DetailedAnalysis {
  errorSummary: {
    totalUniqueErrors: number;
    mostFrequentErrors: FrequencyItem[];
    errorCategories: { type: string; count: number; percentage: string }[];
  };
  warningSummary: {
    totalUniqueWarnings: number;
    mostFrequentWarnings: FrequencyItem[];
    warningCategories: { type: string; count: number; percentage: string }[];
  };
  timeAnalysis: {
    errorsByHour: { hour: number; count: number }[];
    peakErrorHours: { hour: number; count: number }[];
  };
  patternSummary: {
    pattern: string;
    count: number;
    firstOccurrence: number;
    lastOccurrence: number;
  }[];
}

export interface EnhancedFix {
  errorType: string;
  errorCount: number;
  lineRange: string;
  sampleError: {
    line: string;
    lineNumber: number;
    stackTrace: string[];
  };
  hints: {
    general: { category: string; hints: string[] }[];
    specific: string[];
    contextual: string[];
  };
  quickFixes: {
    title: string;
    commands?: string[];
    code?: string;
    description: string;
  }[];
  priority: number;
}

export interface ResolutionStep {
  step: number;
  title: string;
  description: string;
  errors?: {
    type?: string;
    line?: number;
    impact?: string;
    message?: string;
    count?: number;
    percentage?: string;
  }[];
  actions?: string[];
}

export interface SummaryReport {
  executive: {
    totalErrors: number;
    totalWarnings: number;
    criticalIssues: number;
    uniqueErrorTypes: number;
    healthScore: number;
    recommendations: string[];
  };
  technical: {
    topIssues: {
      error: string;
      occurrences: number;
      impact: string;
    }[];
    timePatterns: any[];
    affectedComponents: {
      name: string;
      errorCount: number;
      errorTypes: string[];
    }[];
  };
}

export interface AnalysisResult {
  analysis: LogAnalysis;
  fixSuggestions: FixSuggestion[];
  detailedAnalysis?: DetailedAnalysis;
  enhancedFixes?: EnhancedFix[];
  resolutionSteps?: ResolutionStep[];
  summaryReport?: SummaryReport;
  fileName?: string;
  fileSize?: number;
}