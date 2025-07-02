import React, { useState, useRef } from 'react';
import { Upload, FileText, Loader } from 'lucide-react';
import { AnalysisResult } from '../types';
import { API_ENDPOINTS } from '../config';

interface LogUploadProps {
  onAnalysisComplete: (result: AnalysisResult) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

const LogUpload: React.FC<LogUploadProps> = ({ onAnalysisComplete, isLoading, setIsLoading }) => {
  const [dragActive, setDragActive] = useState(false);
  const [logText, setLogText] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = async (file: File) => {
    setIsLoading(true);
    const formData = new FormData();
    formData.append('logFile', file);

    try {
      const response = await fetch(API_ENDPOINTS.upload, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to analyze log file');
      }

      const result = await response.json();
      onAnalysisComplete(result);
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Failed to analyze log file. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTextAnalysis = async () => {
    if (!logText.trim()) {
      alert('Please enter some log text to analyze');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(API_ENDPOINTS.analyzeText, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ logText }),
      });

      if (!response.ok) {
        throw new Error('Failed to analyze log text');
      }

      const result = await response.json();
      onAnalysisComplete(result);
    } catch (error) {
      console.error('Error analyzing text:', error);
      alert('Failed to analyze log text. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
        Upload Log File or Paste Log Text
      </h2>

      {/* File Upload */}
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center mb-6 transition-colors ${
          dragActive
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <Upload className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500 mb-4" />
        <p className="text-gray-700 dark:text-gray-300 mb-2">
          Drag and drop your log file here, or
        </p>
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={handleFileInput}
          accept=".log,.txt"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          disabled={isLoading}
        >
          Browse Files
        </button>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
          Supported formats: .log, .txt (Max 50MB)
        </p>
      </div>

      {/* Text Input */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Or paste your log text here:
        </label>
        <textarea
          value={logText}
          onChange={(e) => setLogText(e.target.value)}
          className="w-full h-40 px-3 py-2 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-blue-500"
          placeholder="Paste your Java server logs here..."
        />
      </div>

      <button
        onClick={handleTextAnalysis}
        disabled={isLoading || !logText.trim()}
        className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center"
      >
        {isLoading ? (
          <>
            <Loader className="animate-spin h-5 w-5 mr-2" />
            Analyzing...
          </>
        ) : (
          <>
            <FileText className="h-5 w-5 mr-2" />
            Analyze Log Text
          </>
        )}
      </button>
    </div>
  );
};

export default LogUpload;