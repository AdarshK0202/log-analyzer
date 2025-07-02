export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://10.79.8.196:5000';

export const API_ENDPOINTS = {
  upload: `${API_BASE_URL}/api/upload`,
  analyzeText: `${API_BASE_URL}/api/analyze-text`,
  health: `${API_BASE_URL}/api/health`
};