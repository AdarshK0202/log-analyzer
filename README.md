# Log Analyzer

A web application for analyzing Java server logs with AI-powered insights and fix suggestions.

## Features

- **Dark/Light Theme**: Toggle between dark and light modes
- **File Upload**: Drag and drop or browse to upload log files
- **Text Analysis**: Paste log text directly for quick analysis
- **Error Detection**: Identifies common Java errors like:
  - OutOfMemoryError
  - NullPointerException
  - Connection timeouts
  - SQL exceptions
  - Thread deadlocks
  - Performance issues
- **Smart Recommendations**: Get actionable suggestions to fix identified issues
- **Code Snippets**: Receive ready-to-use code fixes for common problems
- **Timeline View**: See error patterns over time
- **Responsive Design**: Works on desktop and mobile devices

## Tech Stack

- **Frontend**: React, TypeScript, Tailwind CSS
- **Backend**: Node.js, Express
- **UI Components**: Lucide React icons

## Installation

1. Clone the repository:
```bash
cd log-analyzer
```

2. Install backend dependencies:
```bash
cd backend
npm install
```

3. Install frontend dependencies:
```bash
cd ../frontend
npm install
```

## Running the Application

### Option 1: Using the start script (Recommended)
```bash
cd log-analyzer
./start.sh
```

### Option 2: Manual start

1. Start the backend server:
```bash
cd backend
npm run dev
```
The backend will run on http://0.0.0.0:5000

2. In a new terminal, start the frontend:
```bash
cd frontend
npm start
```
The frontend will run on http://0.0.0.0:3000

## Accessing the Application

- If running on a VM with IP 10.79.8.196:
  - Frontend: http://10.79.8.196:3000
  - Backend API: http://10.79.8.196:5000
- If running locally:
  - Frontend: http://localhost:3000
  - Backend API: http://localhost:5000

## Usage

1. Open http://localhost:3000 in your browser
2. Upload a Java log file or paste log text
3. Click "Analyze" to process the logs
4. Review the analysis results:
   - Error summary and counts
   - Recommendations for fixes
   - Code snippets to implement solutions
   - Pattern analysis

## API Endpoints

- `POST /api/upload` - Upload and analyze a log file
- `POST /api/analyze-text` - Analyze pasted log text
- `GET /api/health` - Health check endpoint

## Development

- Backend uses nodemon for auto-reload during development
- Frontend uses React's hot reload
- Tailwind CSS for styling with dark mode support

## File Size Limits

- Maximum upload size: 50MB
- Supported formats: .log, .txt