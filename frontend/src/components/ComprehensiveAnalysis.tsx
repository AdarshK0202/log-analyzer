import React, { useState } from 'react';
import { DetailedAnalysis, LogAnalysis } from '../types';
import { TrendingUp, Clock, AlertTriangle, BarChart3, ChevronDown, ChevronRight, AlertCircle } from 'lucide-react';

interface ComprehensiveAnalysisProps {
  analysis: LogAnalysis;
  detailedAnalysis?: DetailedAnalysis;
}

const ComprehensiveAnalysis: React.FC<ComprehensiveAnalysisProps> = ({ analysis, detailedAnalysis }) => {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    frequency: true,
    categories: true,
    time: true,
    patterns: true
  });

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  if (!detailedAnalysis) return null;

  return (
    <div className="space-y-6">
      {/* Error Frequency Analysis */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <div 
          className="flex items-center justify-between cursor-pointer"
          onClick={() => toggleSection('frequency')}
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
            <TrendingUp className="w-5 h-5 mr-2 text-red-500" />
            Most Frequent Errors & Warnings
          </h3>
          {expandedSections.frequency ? 
            <ChevronDown className="w-5 h-5 text-gray-500" /> : 
            <ChevronRight className="w-5 h-5 text-gray-500" />
          }
        </div>
        
        {expandedSections.frequency && (
          <div className="mt-4 grid md:grid-cols-2 gap-6">
            {/* Top Errors */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Top {detailedAnalysis.errorSummary.mostFrequentErrors.length} Most Frequent Errors
                <span className="text-xs text-gray-500 ml-2">
                  ({detailedAnalysis.errorSummary.totalUniqueErrors} unique errors total)
                </span>
              </h4>
              <div className="space-y-2">
                {detailedAnalysis.errorSummary.mostFrequentErrors.map((error, idx) => (
                  <div key={idx} className="bg-red-50 dark:bg-red-900/20 p-3 rounded-md">
                    <div className="flex justify-between items-start">
                      <p className="text-sm text-gray-800 dark:text-gray-200 font-mono flex-1 break-all">
                        {error.message}
                      </p>
                      <div className="ml-3 text-right">
                        <span className="text-sm font-semibold text-red-600 dark:text-red-400">
                          {error.count}x
                        </span>
                        <span className="text-xs text-gray-500 ml-1">
                          ({error.percentage}%)
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Warnings */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Top {detailedAnalysis.warningSummary.mostFrequentWarnings.length} Most Frequent Warnings
                <span className="text-xs text-gray-500 ml-2">
                  ({detailedAnalysis.warningSummary.totalUniqueWarnings} unique warnings total)
                </span>
              </h4>
              <div className="space-y-2">
                {detailedAnalysis.warningSummary.mostFrequentWarnings.map((warning, idx) => (
                  <div key={idx} className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-md">
                    <div className="flex justify-between items-start">
                      <p className="text-sm text-gray-800 dark:text-gray-200 font-mono flex-1 break-all">
                        {warning.message}
                      </p>
                      <div className="ml-3 text-right">
                        <span className="text-sm font-semibold text-yellow-600 dark:text-yellow-400">
                          {warning.count}x
                        </span>
                        <span className="text-xs text-gray-500 ml-1">
                          ({warning.percentage}%)
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Error Categories */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <div 
          className="flex items-center justify-between cursor-pointer"
          onClick={() => toggleSection('categories')}
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
            <BarChart3 className="w-5 h-5 mr-2 text-blue-500" />
            Error & Warning Categories
          </h3>
          {expandedSections.categories ? 
            <ChevronDown className="w-5 h-5 text-gray-500" /> : 
            <ChevronRight className="w-5 h-5 text-gray-500" />
          }
        </div>
        
        {expandedSections.categories && (
          <div className="mt-4 grid md:grid-cols-2 gap-6">
            {/* Error Categories */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Error Categories</h4>
              <div className="space-y-2">
                {detailedAnalysis.errorSummary.errorCategories.map((category, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <span className="text-sm text-gray-700 dark:text-gray-300">{category.type}</span>
                    <div className="flex items-center">
                      <div className="w-32 bg-gray-200 dark:bg-gray-700 rounded-full h-2 mr-3">
                        <div 
                          className="bg-red-500 h-2 rounded-full"
                          style={{ width: `${category.percentage}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {category.count} ({category.percentage}%)
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Warning Categories */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Warning Categories</h4>
              <div className="space-y-2">
                {detailedAnalysis.warningSummary.warningCategories.map((category, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <span className="text-sm text-gray-700 dark:text-gray-300">{category.type}</span>
                    <div className="flex items-center">
                      <div className="w-32 bg-gray-200 dark:bg-gray-700 rounded-full h-2 mr-3">
                        <div 
                          className="bg-yellow-500 h-2 rounded-full"
                          style={{ width: `${category.percentage}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {category.count} ({category.percentage}%)
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Time Analysis */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <div 
          className="flex items-center justify-between cursor-pointer"
          onClick={() => toggleSection('time')}
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
            <Clock className="w-5 h-5 mr-2 text-purple-500" />
            Error Distribution by Time
          </h3>
          {expandedSections.time ? 
            <ChevronDown className="w-5 h-5 text-gray-500" /> : 
            <ChevronRight className="w-5 h-5 text-gray-500" />
          }
        </div>
        
        {expandedSections.time && (
          <div className="mt-4">
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Peak Error Hours</h4>
              <div className="flex items-center space-x-4">
                {detailedAnalysis.timeAnalysis.peakErrorHours.map((peak, idx) => (
                  <div key={idx} className="bg-red-100 dark:bg-red-900/30 px-3 py-2 rounded-md">
                    <span className="text-sm font-medium text-red-700 dark:text-red-300">
                      {peak.hour}:00 - {peak.count} errors
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Hourly Distribution</h4>
              <div className="grid grid-cols-12 gap-1">
                {Array.from({ length: 24 }, (_, hour) => {
                  const data = detailedAnalysis.timeAnalysis.errorsByHour.find(d => d.hour === hour);
                  const count = data?.count || 0;
                  const maxCount = Math.max(...detailedAnalysis.timeAnalysis.errorsByHour.map(d => d.count));
                  const height = maxCount > 0 ? (count / maxCount) * 100 : 0;
                  
                  return (
                    <div key={hour} className="flex flex-col items-center">
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-t-sm" style={{ height: '60px' }}>
                        <div 
                          className="w-full bg-red-500 rounded-t-sm transition-all duration-300"
                          style={{ height: `${height}%`, marginTop: `${60 - (height * 0.6)}px` }}
                          title={`${hour}:00 - ${count} errors`}
                        />
                      </div>
                      <span className="text-xs text-gray-500 mt-1">{hour}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Pattern Summary */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <div 
          className="flex items-center justify-between cursor-pointer"
          onClick={() => toggleSection('patterns')}
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
            <AlertTriangle className="w-5 h-5 mr-2 text-orange-500" />
            Error Pattern Summary
          </h3>
          {expandedSections.patterns ? 
            <ChevronDown className="w-5 h-5 text-gray-500" /> : 
            <ChevronRight className="w-5 h-5 text-gray-500" />
          }
        </div>
        
        {expandedSections.patterns && (
          <div className="mt-4">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead>
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Pattern Type
                    </th>
                    <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Count
                    </th>
                    <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      First Line
                    </th>
                    <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Last Line
                    </th>
                    <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Spread
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {detailedAnalysis.patternSummary.map((pattern, idx) => (
                    <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-4 py-2 text-sm text-gray-900 dark:text-white">
                        <div className="flex items-center">
                          <AlertCircle className="w-4 h-4 mr-2 text-red-500" />
                          {pattern.pattern.replace(/([A-Z])/g, ' $1').trim()}
                        </div>
                      </td>
                      <td className="px-4 py-2 text-sm text-center font-semibold text-red-600 dark:text-red-400">
                        {pattern.count}
                      </td>
                      <td className="px-4 py-2 text-sm text-center text-gray-600 dark:text-gray-400">
                        {pattern.firstOccurrence}
                      </td>
                      <td className="px-4 py-2 text-sm text-center text-gray-600 dark:text-gray-400">
                        {pattern.lastOccurrence}
                      </td>
                      <td className="px-4 py-2 text-sm text-center text-gray-600 dark:text-gray-400">
                        {pattern.lastOccurrence - pattern.firstOccurrence} lines
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ComprehensiveAnalysis;