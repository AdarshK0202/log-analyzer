export interface LogAnalysis {
  summary: {
    totalLines: number;
    errorCount: number;
    warningCount: number;
    infoCount: number;
    debugCount: number;
    criticalErrors: ErrorEntry[];
  };
  patterns: {
    outOfMemory: ErrorEntry[];
    nullPointer: ErrorEntry[];
    connectionTimeout: ErrorEntry[];
    sqlExceptions: ErrorEntry[];
    classNotFound: ErrorEntry[];
    threadDeadlock: ErrorEntry[];
    performanceIssues: ErrorEntry[];
  };
  timeline: TimelineEntry[];
  recommendations: Recommendation[];
}

export interface ErrorEntry {
  lineNumber: number;
  line: string;
  timestamp: string | null;
  type: string;
  stackTrace: string[];
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

export interface AnalysisResult {
  analysis: LogAnalysis;
  fixSuggestions: FixSuggestion[];
  fileName?: string;
  fileSize?: number;
}