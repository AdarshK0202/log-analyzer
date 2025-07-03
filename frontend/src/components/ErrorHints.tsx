import React, { useState } from 'react';
import { Lightbulb, Code, AlertTriangle, ChevronDown, ChevronRight, Terminal, FileCode, CheckCircle2 } from 'lucide-react';

interface HintCategory {
  category: string;
  hints: string[];
}

interface QuickFix {
  title: string;
  commands?: string[];
  code?: string;
  description: string;
}

interface EnhancedFix {
  errorType: string;
  errorCount: number;
  lineRange: string;
  sampleError: {
    line: string;
    lineNumber: number;
    stackTrace: string[];
  };
  hints: {
    general: HintCategory[];
    specific: string[];
    contextual: string[];
  };
  quickFixes: QuickFix[];
  priority: number;
}

interface ResolutionStep {
  step: number;
  title: string;
  description: string;
  errors?: any[];
  actions?: string[];
}

interface ErrorHintsProps {
  enhancedFixes?: EnhancedFix[];
  resolutionSteps?: ResolutionStep[];
  summaryReport?: {
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
  };
}

const ErrorHints: React.FC<ErrorHintsProps> = ({ enhancedFixes, resolutionSteps, summaryReport }) => {
  const [expandedFixes, setExpandedFixes] = useState<Set<number>>(new Set([0]));
  const [activeTab, setActiveTab] = useState<'hints' | 'steps' | 'report'>('hints');

  const toggleFix = (index: number) => {
    const newExpanded = new Set(expandedFixes);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedFixes(newExpanded);
  };

  const getPriorityColor = (priority: number) => {
    if (priority >= 90) return 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30';
    if (priority >= 70) return 'text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/30';
    if (priority >= 50) return 'text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/30';
    return 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30';
  };

  const getHealthScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    if (score >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  if (!enhancedFixes || enhancedFixes.length === 0) return null;

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-1">
        <div className="flex space-x-1">
          <button
            onClick={() => setActiveTab('hints')}
            className={`flex-1 px-4 py-2 rounded-md transition-colors ${
              activeTab === 'hints' 
                ? 'bg-blue-500 text-white' 
                : 'hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <Lightbulb className="w-4 h-4 inline mr-2" />
            Solution Hints
          </button>
          <button
            onClick={() => setActiveTab('steps')}
            className={`flex-1 px-4 py-2 rounded-md transition-colors ${
              activeTab === 'steps' 
                ? 'bg-blue-500 text-white' 
                : 'hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <CheckCircle2 className="w-4 h-4 inline mr-2" />
            Resolution Steps
          </button>
          <button
            onClick={() => setActiveTab('report')}
            className={`flex-1 px-4 py-2 rounded-md transition-colors ${
              activeTab === 'report' 
                ? 'bg-blue-500 text-white' 
                : 'hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <FileCode className="w-4 h-4 inline mr-2" />
            Summary Report
          </button>
        </div>
      </div>

      {/* Solution Hints Tab */}
      {activeTab === 'hints' && (
        <div className="space-y-4">
          {enhancedFixes.map((fix, index) => (
            <div key={index} className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
              <div 
                className="p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
                onClick={() => toggleFix(index)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {expandedFixes.has(index) ? 
                      <ChevronDown className="w-5 h-5 text-gray-500" /> : 
                      <ChevronRight className="w-5 h-5 text-gray-500" />
                    }
                    <AlertTriangle className="w-5 h-5 text-red-500" />
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {fix.errorType.replace(/([A-Z])/g, ' $1').trim()}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {fix.errorCount} occurrences • Lines {fix.lineRange}
                      </p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getPriorityColor(fix.priority)}`}>
                    Priority: {fix.priority}
                  </span>
                </div>
              </div>

              {expandedFixes.has(index) && (
                <div className="border-t border-gray-200 dark:border-gray-700">
                  {/* Sample Error */}
                  <div className="p-4 bg-gray-50 dark:bg-gray-900">
                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Sample Error (Line {fix.sampleError.lineNumber})
                    </h4>
                    <pre className="text-xs bg-gray-900 dark:bg-gray-800 text-gray-100 p-3 rounded overflow-x-auto">
                      <code>{fix.sampleError.line}</code>
                    </pre>
                    {fix.sampleError.stackTrace.length > 0 && (
                      <div className="mt-2">
                        <p className="text-xs text-gray-600 dark:text-gray-400">Stack trace:</p>
                        <pre className="text-xs bg-gray-900 dark:bg-gray-800 text-gray-100 p-2 mt-1 rounded overflow-x-auto">
                          {fix.sampleError.stackTrace.join('\n')}
                        </pre>
                      </div>
                    )}
                  </div>

                  {/* General Hints */}
                  <div className="p-4 space-y-4">
                    {fix.hints.general.map((category, catIdx) => (
                      <div key={catIdx}>
                        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                          <Lightbulb className="w-4 h-4 mr-2 text-yellow-500" />
                          {category.category}
                        </h4>
                        <ul className="space-y-1">
                          {category.hints.map((hint, hintIdx) => (
                            <li key={hintIdx} className="text-sm text-gray-600 dark:text-gray-400 flex items-start">
                              <span className="text-blue-500 mr-2">•</span>
                              <span>{hint}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}

                    {/* Specific Hints */}
                    {fix.hints.specific.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                          <AlertTriangle className="w-4 h-4 mr-2 text-orange-500" />
                          Specific to This Error
                        </h4>
                        <ul className="space-y-1">
                          {fix.hints.specific.map((hint, idx) => (
                            <li key={idx} className="text-sm text-gray-600 dark:text-gray-400 flex items-start">
                              <span className="text-orange-500 mr-2">→</span>
                              <span>{hint}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Contextual Hints */}
                    {fix.hints.contextual.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                          <Code className="w-4 h-4 mr-2 text-purple-500" />
                          Based on Error Context
                        </h4>
                        <ul className="space-y-1">
                          {fix.hints.contextual.map((hint, idx) => (
                            <li key={idx} className="text-sm text-gray-600 dark:text-gray-400 flex items-start">
                              <span className="text-purple-500 mr-2">✓</span>
                              <span>{hint}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Quick Fixes */}
                    {fix.quickFixes.length > 0 && (
                      <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center">
                          <Terminal className="w-4 h-4 mr-2 text-green-500" />
                          Quick Fixes
                        </h4>
                        <div className="space-y-3">
                          {fix.quickFixes.map((qf, qfIdx) => (
                            <div key={qfIdx} className="bg-gray-50 dark:bg-gray-900 rounded p-3">
                              <h5 className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-2">
                                {qf.title}
                              </h5>
                              {qf.commands && qf.commands.length > 0 && (
                                <pre className="text-xs bg-gray-900 dark:bg-gray-800 text-gray-100 p-2 rounded overflow-x-auto mb-2">
                                  {qf.commands.join('\n')}
                                </pre>
                              )}
                              {qf.code && (
                                <pre className="text-xs bg-gray-900 dark:bg-gray-800 text-gray-100 p-2 rounded overflow-x-auto mb-2">
                                  <code>{qf.code}</code>
                                </pre>
                              )}
                              <p className="text-xs text-gray-600 dark:text-gray-400">
                                {qf.description}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Resolution Steps Tab */}
      {activeTab === 'steps' && resolutionSteps && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
            Recommended Resolution Steps
          </h3>
          <div className="space-y-6">
            {resolutionSteps.map((step, idx) => (
              <div key={idx} className="flex">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold">
                    {step.step}
                  </div>
                </div>
                <div className="ml-4 flex-1">
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                    {step.title}
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    {step.description}
                  </p>
                  {step.errors && (
                    <div className="bg-gray-50 dark:bg-gray-900 rounded p-3 mb-3">
                      {step.errors.map((error, eIdx) => (
                        <div key={eIdx} className="text-sm mb-1">
                          {error.type && <span className="font-medium">{error.type}</span>}
                          {error.line && <span className="text-gray-600"> - Line {error.line}</span>}
                          {error.impact && <span className="text-red-600"> ({error.impact})</span>}
                          {error.message && <span className="text-gray-600"> - {error.message}</span>}
                          {error.count && <span className="font-medium"> ({error.count}x)</span>}
                        </div>
                      ))}
                    </div>
                  )}
                  {step.actions && (
                    <ul className="space-y-1">
                      {step.actions.map((action, aIdx) => (
                        <li key={aIdx} className="text-sm text-gray-600 dark:text-gray-400 flex items-start">
                          <CheckCircle2 className="w-4 h-4 mr-2 text-green-500 flex-shrink-0 mt-0.5" />
                          <span>{action}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Summary Report Tab */}
      {activeTab === 'report' && summaryReport && (
        <div className="space-y-6">
          {/* Executive Summary */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Executive Summary
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-red-600">{summaryReport.executive.totalErrors}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Errors</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-yellow-600">{summaryReport.executive.totalWarnings}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Warnings</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-orange-600">{summaryReport.executive.criticalIssues}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Critical Issues</p>
              </div>
              <div className="text-center">
                <p className={`text-3xl font-bold ${getHealthScoreColor(summaryReport.executive.healthScore)}`}>
                  {summaryReport.executive.healthScore}%
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Health Score</p>
              </div>
            </div>
            
            {summaryReport.executive.recommendations.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Key Recommendations
                </h4>
                <ul className="space-y-2">
                  {summaryReport.executive.recommendations.map((rec: string, idx: number) => (
                    <li key={idx} className="flex items-start">
                      <AlertTriangle className="w-4 h-4 mr-2 text-orange-500 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Technical Details */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Technical Analysis
            </h3>
            
            {/* Top Issues */}
            <div className="mb-6">
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                Top Issues by Frequency
              </h4>
              <div className="space-y-2">
                {summaryReport.technical.topIssues.map((issue: { error: string; occurrences: number; impact: string }, idx: number) => (
                  <div key={idx} className="bg-gray-50 dark:bg-gray-900 rounded p-3">
                    <div className="flex justify-between items-start mb-1">
                      <p className="text-sm font-mono text-gray-800 dark:text-gray-200 flex-1">
                        {issue.error}
                      </p>
                      <span className="text-sm font-semibold text-red-600 ml-3">
                        {issue.occurrences}x
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Impact: {issue.impact}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Affected Components */}
            {summaryReport.technical.affectedComponents.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                  Affected Components
                </h4>
                <div className="space-y-2">
                  {summaryReport.technical.affectedComponents.map((comp: { name: string; errorCount: number; errorTypes: string[] }, idx: number) => (
                    <div key={idx} className="flex items-center justify-between bg-gray-50 dark:bg-gray-900 rounded p-3">
                      <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                        {comp.name}
                      </span>
                      <div className="text-right">
                        <span className="text-sm font-semibold text-red-600">
                          {comp.errorCount} errors
                        </span>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          {comp.errorTypes.join(', ')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ErrorHints;