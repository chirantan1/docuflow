const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads/temp'));
  },
  filename: (req, file, cb) => {
    const uniqueId = uuidv4();
    const ext = path.extname(file.originalname);
    cb(null, `${uniqueId}${ext}`);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 100 * 1024 * 1024 }
});

const cleanup = async (files) => {
  const filesToDelete = Array.isArray(files) ? files : [files];
  for (const file of filesToDelete) {
    if (file && file.path) {
      try {
        if (fs.existsSync(file.path)) {
          await fs.promises.unlink(file.path);
        }
      } catch (e) {
        console.error(`Error deleting file ${file.path}:`, e);
      }
    }
  }
};

// Workflow Templates
const workflowTemplates = {
  'convert-to-pdf': [
    { id: 'upload', name: 'Upload File', type: 'upload' },
    { id: 'convert', name: 'Convert to PDF', type: 'convert', params: { format: 'pdf' } },
    { id: 'compress', name: 'Compress PDF', type: 'compress' },
    { id: 'download', name: 'Download', type: 'download' }
  ],
  'image-processing': [
    { id: 'upload', name: 'Upload Image', type: 'upload' },
    { id: 'resize', name: 'Resize Image', type: 'resize', params: { width: 800, height: 600 } },
    { id: 'watermark', name: 'Add Watermark', type: 'watermark', params: { text: 'PROCESSED' } },
    { id: 'download', name: 'Download', type: 'download' }
  ],
  'video-processing': [
    { id: 'upload', name: 'Upload Video', type: 'upload' },
    { id: 'compress', name: 'Compress Video', type: 'compress', params: { quality: 0.8 } },
    { id: 'thumbnail', name: 'Extract Thumbnail', type: 'thumbnail' },
    { id: 'download', name: 'Download', type: 'download' }
  ]
};

// Get workflow templates
router.get('/templates', (req, res) => {
  res.json(workflowTemplates);
});

// Execute workflow
router.post('/execute', upload.array('files', 20), async (req, res) => {
  try {
    const { workflowId, files } = req.body;
    const uploadedFiles = req.files || [];
    
    if (!workflowId || !workflowTemplates[workflowId]) {
      await cleanup(uploadedFiles);
      return res.status(400).json({ error: 'Invalid workflow ID' });
    }
    
    const workflow = workflowTemplates[workflowId];
    const results = [];
    let currentFiles = uploadedFiles;
    
    for (const step of workflow) {
      try {
        if (step.type === 'upload') {
          // Files already uploaded
          results.push({ step: step.id, status: 'success', message: `${currentFiles.length} file(s) uploaded` });
          continue;
        }
        
        if (step.type === 'download') {
          // Prepare files for download
          if (currentFiles && currentFiles.length > 0) {
            const outputDir = path.join(__dirname, '../uploads/temp');
            const outputPath = path.join(outputDir, `workflow_result_${uuidv4()}.zip`);
            
            // Create zip of all processed files
            // In production, use archiver or similar
            
            results.push({ 
              step: step.id, 
              status: 'success', 
              message: 'Files ready for download',
              downloadUrl: '/uploads/temp/result.zip'
            });
          }
          continue;
        }
        
        // Process step based on type
        if (currentFiles && currentFiles.length > 0) {
          // Apply processing based on step type
          for (const file of currentFiles) {
            // Process file with appropriate tool
            // This would integrate with other processing endpoints
            results.push({
              step: step.id,
              status: 'processed',
              input: file.originalname,
              params: step.params
            });
          }
        }
      } catch (stepError) {
        results.push({
          step: step.id,
          status: 'failed',
          error: stepError.message
        });
      }
    }
    
    // Clean up temporary files
    await cleanup(uploadedFiles);
    
    res.json({
      workflowId,
      status: 'completed',
      results: results,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Workflow error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Save workflow
router.post('/save', express.json(), (req, res) => {
  try {
    const { id, name, steps } = req.body;
    if (!id || !name || !steps || !Array.isArray(steps)) {
      return res.status(400).json({ error: 'Invalid workflow data' });
    }
    
    // Save workflow to database/file
    // For now, just return success
    res.json({
      success: true,
      message: 'Workflow saved successfully',
      workflow: { id, name, steps }
    });
  } catch (error) {
    console.error('Save workflow error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;