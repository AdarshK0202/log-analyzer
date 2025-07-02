const express = require('express');
const cors = require('cors');
const multer = require('multer');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
const { analyzeJavaLogs, generateFixSuggestions } = require('./logAnalyzer');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type']
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir);
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

app.post('/api/upload', upload.single('logFile'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const filePath = req.file.path;
    const logContent = fs.readFileSync(filePath, 'utf8');
    
    const analysis = await analyzeJavaLogs(logContent);
    const fixSuggestions = generateFixSuggestions(analysis);
    
    fs.unlinkSync(filePath);

    res.json({
      analysis,
      fixSuggestions,
      fileName: req.file.originalname,
      fileSize: req.file.size
    });
  } catch (error) {
    console.error('Error processing log file:', error);
    res.status(500).json({ error: 'Failed to process log file' });
  }
});

app.post('/api/analyze-text', async (req, res) => {
  try {
    const { logText } = req.body;
    
    if (!logText) {
      return res.status(400).json({ error: 'No log text provided' });
    }

    const analysis = await analyzeJavaLogs(logText);
    const fixSuggestions = generateFixSuggestions(analysis);

    res.json({
      analysis,
      fixSuggestions
    });
  } catch (error) {
    console.error('Error analyzing log text:', error);
    res.status(500).json({ error: 'Failed to analyze log text' });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
  console.log(`Server accessible at http://10.79.8.196:${PORT}`);
});