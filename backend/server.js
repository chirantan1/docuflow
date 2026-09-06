const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log('📁 Created uploads directory');
}

const pdfRoutes = require('./routes/pdf');
const imageRoutes = require('./routes/image');
const videoRoutes = require('./routes/video');
const audioRoutes = require('./routes/audio');
const documentRoutes = require('./routes/document');
const workflowRoutes = require('./routes/workflow');

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'DocuFlow API is running',
    timestamp: new Date().toISOString()
  });
});

app.use('/api/pdf', pdfRoutes);
app.use('/api/image', imageRoutes);
app.use('/api/video', videoRoutes);
app.use('/api/audio', audioRoutes);
app.use('/api/document', documentRoutes);
app.use('/api/workflow', workflowRoutes);

app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.use((err, req, res, next) => {
  console.error('❌ Server error:', err.message);
  res.status(500).json({ error: err.message || 'Something went wrong!' });
});

app.listen(PORT, () => {
  console.log(`\n🚀 DocuFlow backend running on http://localhost:${PORT}`);
  console.log(`📁 Upload directory: ${uploadDir}`);
  console.log(`✅ Health check: http://localhost:${PORT}/api/health\n`);
});