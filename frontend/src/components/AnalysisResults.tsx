import React, { useState } from 'react';
import { XCircle, ChevronDown, ChevronUp, Code, RefreshCw } from 'lucide-react';
import { AnalysisResult } from '../types';
import ComprehensiveAnalysis from './ComprehensiveAnalysis';
import ErrorHints from './ErrorHints';

interface AnalysisResultsProps {
  result: AnalysisResult;
  onReset: () => void;
}

const AnalysisResults: React.FC<AnalysisResultsProps> = ({ result, onReset }) => {
  const [expandedSections, setExpandedSections] = useState<string[]>(['recommendations']);

  const toggleSection = (section: string) => {
    setExpandedSections(prev =>
      prev.includes(section)
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30';
      case 'HIGH':
        return 'text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/30';
      case 'MEDIUM':
        return 'text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/30';
      default:
        return 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Analysis Results
          </h2>
          <button
            onClick={onReset}
            className="flex items-center px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            New Analysis
          </button>
        </div>
        {result.fileName && (
          <p className="text-sm text-gray-600 dark:text-gray-400">
            File: {result.fileName} ({(result.fileSize! / 1024).toFixed(2)} KB)
          </p>
        )}
      </div>

      {/* Critical Errors */}
      {result.analysis.summary.criticalErrors.length > 0 && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
          <div className="flex items-center mb-4">
            <XCircle className="h-6 w-6 text-red-600 dark:text-red-400 mr-2" />
            <h3 className="text-lg font-semibold text-red-900 dark:text-red-200">
              Critical Errors Found ({result.analysis.summary.criticalErrors.length})
            </h3>
          </div>
          <div className="space-y-3">
            {result.analysis.summary.criticalErrors.slice(0, 3).map((error, index) => (
              <div key={index} className="bg-white dark:bg-gray-800 rounded p-3">
                <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                  {error.type.replace(/([A-Z])/g, ' $1').trim()} - Line {error.lineNumber}
                </p>
                <code className="text-xs text-gray-600 dark:text-gray-400 block overflow-x-auto">
                  {error.line}
                </code>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <button
          onClick={() => toggleSection('recommendations')}
          className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Recommendations ({result.analysis.recommendations.length})
          </h3>
          {expandedSections.includes('recommendations') ? (
            <ChevronUp className="h-5 w-5 text-gray-500" />
          ) : (
            <ChevronDown className="h-5 w-5 text-gray-500" />
          )}
        </button>
        
        {expandedSections.includes('recommendations') && (
          <div className="px-6 pb-6 space-y-4">
            {result.analysis.recommendations.map((rec, index) => (
              <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-medium text-gray-900 dark:text-white">
                    {rec.issue}
                  </h4>
                  <span className={`px-2 py-1 text-xs font-medium rounded ${getSeverityColor(rec.severity)}`}>
                    {rec.severity}
                  </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  {rec.description}
                </p>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Suggestions:
                  </p>
                  <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-400 space-y-1">
                    {rec.suggestions.map((suggestion, idx) => (
                      <li key={idx}>{suggestion}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Fix Suggestions */}
      {result.fixSuggestions.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <button
            onClick={() => toggleSection('fixes')}
            className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Code Fixes ({result.fixSuggestions.length})
            </h3>
            {expandedSections.includes('fixes') ? (
              <ChevronUp className="h-5 w-5 text-gray-500" />
            ) : (
              <ChevronDown className="h-5 w-5 text-gray-500" />
            )}
          </button>
          
          {expandedSections.includes('fixes') && (
            <div className="px-6 pb-6 space-y-4">
              {result.fixSuggestions.slice(0, 5).map((suggestion, index) => (
                <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <p className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                    Fix for: {suggestion.error.type.replace(/([A-Z])/g, ' $1').trim()}
                  </p>
                  <div className="space-y-3">
                    {suggestion.fixes.map((fix, idx) => (
                      <div key={idx} className="bg-gray-50 dark:bg-gray-900 rounded p-3">
                        <div className="flex items-center mb-2">
                          <Code className="h-4 w-4 text-gray-500 mr-2" />
                          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            {fix.title}
                          </p>
                        </div>
                        <pre className="text-xs bg-gray-900 dark:bg-gray-800 text-gray-100 p-2 rounded overflow-x-auto">
                          <code>{fix.code}</code>
                        </pre>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                          {fix.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Error Patterns */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <button
          onClick={() => toggleSection('patterns')}
          className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Error Patterns
          </h3>
          {expandedSections.includes('patterns') ? (
            <ChevronUp className="h-5 w-5 text-gray-500" />
          ) : (
            <ChevronDown className="h-5 w-5 text-gray-500" />
          )}
        </button>
        
        {expandedSections.includes('patterns') && (
          <div className="px-6 pb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(result.analysis.patterns).map(([pattern, errors]) => (
                <div key={pattern} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900 dark:text-white capitalize">
                      {pattern.replace(/([A-Z])/g, ' $1').trim()}
                    </h4>
                    <span className={`px-2 py-1 text-xs font-medium rounded ${
                      errors.length > 0 ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' : 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                    }`}>
                      {errors.length}
                    </span>
                  </div>
                  {errors.length > 0 && (
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      First occurrence: Line {errors[0].lineNumber}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Comprehensive Analysis */}
      {result.detailedAnalysis && (
        <>
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg p-6 shadow-lg">
            <h2 className="text-2xl font-bold mb-2">Comprehensive Error Analysis</h2>
            <p className="text-blue-100">
              Detailed insights into error patterns, frequencies, and time-based distributions
            </p>
          </div>
          <ComprehensiveAnalysis 
            analysis={result.analysis} 
            detailedAnalysis={result.detailedAnalysis} 
          />
        </>
      )}

      {/* Error Resolution Hints */}
      {(result.enhancedFixes || result.resolutionSteps || result.summaryReport) && (
        <>
          <div className="bg-gradient-to-r from-green-500 to-teal-600 text-white rounded-lg p-6 shadow-lg">
            <h2 className="text-2xl font-bold mb-2">Error Resolution Guide</h2>
            <p className="text-green-100">
              Contextual hints, step-by-step solutions, and quick fixes for identified errors
            </p>
          </div>
          <ErrorHints 
            enhancedFixes={result.enhancedFixes}
            resolutionSteps={result.resolutionSteps}
            summaryReport={result.summaryReport}
          />
        </>
      )}
    </div>
  );
};

export default AnalysisResults;