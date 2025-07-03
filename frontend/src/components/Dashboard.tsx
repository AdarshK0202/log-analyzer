import React, { useState } from 'react';
import { Sun, Moon, FileText, AlertCircle, CheckCircle, Info } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import LogUpload from './LogUpload';
import AnalysisResults from './AnalysisResults';
import { AnalysisResult } from '../types';

const Dashboard: React.FC = () => {
  const { isDark, toggleTheme } = useTheme();
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleAnalysisComplete = (result: AnalysisResult) => {
    setAnalysisResult(result);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <FileText className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Log Analyzer
              </h1>
            </div>
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              aria-label="Toggle theme"
            >
              {isDark ? (
                <Sun className="h-5 w-5 text-yellow-500" />
              ) : (
                <Moon className="h-5 w-5 text-gray-700" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Total Logs Analyzed
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {analysisResult ? analysisResult.analysis.summary.totalLines : 0}
                </p>
              </div>
              <FileText className="h-8 w-8 text-gray-400" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Errors Found
                </p>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {analysisResult ? analysisResult.analysis.summary.errorCount : 0}
                </p>
              </div>
              <AlertCircle className="h-8 w-8 text-red-400" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Warnings
                </p>
                <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                  {analysisResult ? analysisResult.analysis.summary.warningCount : 0}
                </p>
              </div>
              <Info className="h-8 w-8 text-yellow-400" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Status
                </p>
                <p className="text-sm font-bold text-green-600 dark:text-green-400">
                  {analysisResult ? 'Analysis Complete' : 'Ready'}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-400" />
            </div>
          </div>
        </div>

        {/* Upload Section */}
        {!analysisResult && (
          <LogUpload
            onAnalysisComplete={handleAnalysisComplete}
            isLoading={isLoading}
            setIsLoading={setIsLoading}
          />
        )}

        {/* Results Section */}
        {analysisResult && (
          <AnalysisResults
            result={analysisResult}
            onReset={() => setAnalysisResult(null)}
          />
        )}
      </main>
    </div>
  );
};

export default Dashboard;