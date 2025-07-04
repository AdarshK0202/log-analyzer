import React, { useState } from 'react';
import { ApiPerformanceAnalysis, ApiMetricSummary, ApiPerformanceRecommendation } from '../types';
import { Clock, TrendingUp, TrendingDown, AlertCircle, CheckCircle, XCircle, BarChart, Activity } from 'lucide-react';

interface ApiPerformanceProps {
  apiPerformance: ApiPerformanceAnalysis;
}

const ApiPerformance: React.FC<ApiPerformanceProps> = ({ apiPerformance }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'endpoints' | 'distribution' | 'timeline' | 'recommendations'>('overview');

  const formatTime = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const formatPercentage = (value: number, total: number) => {
    return ((value / total) * 100).toFixed(1);
  };

  const getStatusColor = (successRate: string) => {
    const rate = parseFloat(successRate);
    if (rate >= 99) return 'text-green-600 dark:text-green-400';
    if (rate >= 95) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800';
      case 'HIGH': return 'bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-800';
      case 'MEDIUM': return 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800';
      case 'LOW': return 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800';
      default: return 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700';
    }
  };

  const renderOverview = () => {
    const { summary, performanceDistribution } = apiPerformance;

    return (
      <div className="space-y-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total API Calls</p>
                <p className="text-2xl font-bold dark:text-white">{summary.totalApiCalls.toLocaleString()}</p>
              </div>
              <Activity className="w-8 h-8 text-blue-500 dark:text-blue-400" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Average Response Time</p>
                <p className="text-2xl font-bold dark:text-white">{formatTime(summary.averageResponseTime)}</p>
              </div>
              <Clock className="w-8 h-8 text-purple-500 dark:text-purple-400" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Success Rate</p>
                <p className={`text-2xl font-bold ${getStatusColor(summary.successRate)}`}>
                  {summary.successRate}%
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500 dark:text-green-400" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Failed Calls</p>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">{summary.failureCount}</p>
              </div>
              <XCircle className="w-8 h-8 text-red-500 dark:text-red-400" />
            </div>
          </div>
        </div>

        {/* Performance Distribution */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4 dark:text-white">Response Time Distribution</h3>
          <div className="space-y-3">
            {Object.entries(performanceDistribution).map(([range, count]) => {
              const percentage = formatPercentage(count, summary.totalApiCalls);
              const label = range.replace(/([a-z])([A-Z])/g, '$1 $2').replace('ms', ' ms');
              
              return (
                <div key={range} className="flex items-center space-x-4">
                  <div className="w-32 text-sm text-gray-600 dark:text-gray-400">{label}</div>
                  <div className="flex-1">
                    <div className="bg-gray-200 dark:bg-gray-700 rounded-full h-6 relative">
                      <div
                        className={`h-6 rounded-full ${
                          range === 'under100ms' ? 'bg-green-500' :
                          range === 'under500ms' ? 'bg-blue-500' :
                          range === 'under1000ms' ? 'bg-yellow-500' :
                          range === 'under5000ms' ? 'bg-orange-500' :
                          'bg-red-500'
                        }`}
                        style={{ width: `${percentage}%` }}
                      />
                      <span className="absolute inset-0 flex items-center justify-center text-xs font-medium dark:text-gray-200">
                        {count} ({percentage}%)
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Slow and Fast APIs */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4 flex items-center dark:text-white">
              <TrendingDown className="w-5 h-5 mr-2 text-red-500 dark:text-red-400" />
              Slowest APIs
            </h3>
            <div className="space-y-2">
              {summary.slowApis.slice(0, 5).map((api, index) => (
                <div key={index} className="border-b dark:border-gray-700 pb-2">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="font-medium text-sm dark:text-gray-200">{api.commandName}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{api.className}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-red-600 dark:text-red-400">{formatTime(api.avgResponseTime)}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{api.callCount} calls</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4 flex items-center dark:text-white">
              <TrendingUp className="w-5 h-5 mr-2 text-green-500 dark:text-green-400" />
              Fastest APIs
            </h3>
            <div className="space-y-2">
              {summary.fastApis.slice(0, 5).map((api, index) => (
                <div key={index} className="border-b pb-2">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{api.commandName}</p>
                      <p className="text-xs text-gray-500">{api.className}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-green-600">{formatTime(api.avgResponseTime)}</p>
                      <p className="text-xs text-gray-500">{api.callCount} calls</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderEndpoints = () => {
    const { summary } = apiPerformance;
    const sortedCommands = Object.entries(summary.apiCallsByCommand)
      .sort((a, b) => b[1].count - a[1].count);

    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  API Endpoint
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Calls
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Avg Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Min/Max
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Success Rate
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Total Time
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {sortedCommands.map(([command, metrics]) => {
                const successRate = ((metrics.successCount / metrics.count) * 100).toFixed(1);
                return (
                  <tr key={command} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                      {command}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {metrics.count.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {formatTime(metrics.avgTime)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {formatTime(metrics.minTime)} / {formatTime(metrics.maxTime)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`text-sm font-medium ${getStatusColor(successRate)}`}>
                        {successRate}%
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {formatTime(metrics.totalTime)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderTimeline = () => {
    const { timeline } = apiPerformance;
    const recentCalls = timeline.slice(-100).reverse();

    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="p-4 border-b dark:border-gray-700">
          <h3 className="text-lg font-semibold dark:text-white">Recent API Calls Timeline</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">Showing last 100 API calls</p>
        </div>
        <div className="overflow-x-auto max-h-96">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900 sticky top-0">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Timestamp
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  API Endpoint
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Class
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Response Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {recentCalls.map((call, index) => (
                <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500 dark:text-gray-400">
                    {new Date(call.timestamp).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                    {call.commandName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {call.className}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={call.processingTime > 1000 ? 'text-orange-600 dark:text-orange-400 font-medium' : 'text-gray-500 dark:text-gray-400'}>
                      {formatTime(call.processingTime)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      call.status === 'SUCCESS' 
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400' 
                        : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400'
                    }`}>
                      {call.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderRecommendations = () => {
    const { recommendations } = apiPerformance;

    if (recommendations.length === 0) {
      return (
        <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow text-center">
          <CheckCircle className="w-12 h-12 text-green-500 dark:text-green-400 mx-auto mb-4" />
          <p className="text-lg text-gray-600 dark:text-gray-400">No performance issues detected!</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {recommendations.map((rec, index) => (
          <div key={index} className={`p-6 rounded-lg border ${getSeverityColor(rec.severity)}`}>
            <div className="flex items-start">
              <AlertCircle className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <div className="flex items-center mb-2">
                  <span className="font-semibold text-lg">{rec.issue}</span>
                  <span className={`ml-3 px-2 py-1 text-xs rounded ${getSeverityColor(rec.severity)}`}>
                    {rec.severity}
                  </span>
                </div>
                <p className="text-sm mb-3">{rec.description}</p>
                
                {rec.affectedApis && rec.affectedApis.length > 0 && (
                  <div className="mb-3">
                    <p className="text-sm font-medium mb-1">Affected APIs:</p>
                    <ul className="list-disc list-inside text-sm space-y-1">
                      {rec.affectedApis.map((api, i) => (
                        <li key={i}>{api}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {rec.peakHours && rec.peakHours.length > 0 && (
                  <div className="mb-3">
                    <p className="text-sm font-medium mb-1">Peak Hours:</p>
                    <p className="text-sm">{rec.peakHours.join(', ')}</p>
                  </div>
                )}
                
                <div>
                  <p className="text-sm font-medium mb-1">Suggestions:</p>
                  <ul className="list-disc list-inside text-sm space-y-1">
                    {rec.suggestions.map((suggestion, i) => (
                      <li key={i}>{suggestion}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold mb-6 flex items-center dark:text-white">
          <BarChart className="w-8 h-8 mr-3 text-blue-600 dark:text-blue-400" />
          API Performance Analysis
        </h2>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'overview', label: 'Overview' },
              { id: 'endpoints', label: 'Endpoints' },
              { id: 'timeline', label: 'Timeline' },
              { id: 'recommendations', label: 'Recommendations' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                {tab.label}
                {tab.id === 'recommendations' && apiPerformance.recommendations.length > 0 && (
                  <span className="ml-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-2 py-0.5 rounded-full text-xs">
                    {apiPerformance.recommendations.length}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div>
          {activeTab === 'overview' && renderOverview()}
          {activeTab === 'endpoints' && renderEndpoints()}
          {activeTab === 'timeline' && renderTimeline()}
          {activeTab === 'recommendations' && renderRecommendations()}
        </div>
      </div>
    </div>
  );
};

export default ApiPerformance;