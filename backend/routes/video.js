const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegInstaller = require('@ffmpeg-installer/ffmpeg');

ffmpeg.setFfmpegPath(ffmpegInstaller.path);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads/videos'));
  },
  filename: (req, file, cb) => {
    const uniqueId = uuidv4();
    const ext = path.extname(file.originalname);
    cb(null, `${uniqueId}${ext}`);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 500 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['video/mp4', 'video/webm', 'video/avi', 'video/mov'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only video files are allowed'), false);
    }
  }
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

// 1. Compress Video
router.post('/compress', upload.single('video'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Please upload a video' });
    }

    const outputPath = path.join(__dirname, '../uploads/videos', `compressed_${uuidv4()}.mp4`);
    const quality = parseInt(req.body.quality) || 1.0;
    
    await new Promise((resolve, reject) => {
      ffmpeg(req.file.path)
        .videoCodec('libx264')
        .audioCodec('aac')
        .videoBitrate(`${quality * 2}M`)
        .size('50%')
        .on('end', resolve)
        .on('error', reject)
        .save(outputPath);
    });
    
    await cleanup(req.file);
    
    res.download(outputPath, 'compressed.mp4', (err) => {
      if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
    });
  } catch (error) {
    await cleanup(req.file);
    console.error('Compress error:', error);
    res.status(500).json({ error: error.message });
  }
});

// 2. Extract Thumbnail
router.post('/thumbnail', upload.single('video'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Please upload a video' });
    }

    const timestamp = req.body.timestamp || '00:00:01';
    const outputPath = path.join(__dirname, '../uploads/thumbnails', `thumb_${uuidv4()}.jpg`);
    
    await new Promise((resolve, reject) => {
      ffmpeg(req.file.path)
        .screenshots({
          timestamps: [timestamp],
          filename: path.basename(outputPath),
          folder: path.dirname(outputPath),
          size: '320x240'
        })
        .on('end', resolve)
        .on('error', reject);
    });
    
    await cleanup(req.file);
    
    res.download(outputPath, 'thumbnail.jpg', (err) => {
      if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
    });
  } catch (error) {
    await cleanup(req.file);
    console.error('Thumbnail error:', error);
    res.status(500).json({ error: error.message });
  }
});

// 3. Convert Video Format
router.post('/convert', upload.single('video'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Please upload a video' });
    }

    const format = req.body.format || 'mp4';
    const outputPath = path.join(__dirname, '../uploads/videos', `converted_${uuidv4()}.${format}`);
    
    await new Promise((resolve, reject) => {
      ffmpeg(req.file.path)
        .toFormat(format)
        .on('end', resolve)
        .on('error', reject)
        .save(outputPath);
    });
    
    await cleanup(req.file);
    
    res.download(outputPath, `converted.${format}`, (err) => {
      if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
    });
  } catch (error) {
    await cleanup(req.file);
    console.error('Convert error:', error);
    res.status(500).json({ error: error.message });
  }
});

// 4. Trim Video
router.post('/trim', upload.single('video'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Please upload a video' });
    }

    const startTime = req.body.startTime || '00:00:00';
    const duration = req.body.duration || '00:00:10';
    const outputPath = path.join(__dirname, '../uploads/videos', `trimmed_${uuidv4()}.mp4`);
    
    await new Promise((resolve, reject) => {
      ffmpeg(req.file.path)
        .setStartTime(startTime)
        .duration(duration)
        .on('end', resolve)
        .on('error', reject)
        .save(outputPath);
    });
    
    await cleanup(req.file);
    
    res.download(outputPath, 'trimmed.mp4', (err) => {
      if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
    });
  } catch (error) {
    await cleanup(req.file);
    console.error('Trim error:', error);
    res.status(500).json({ error: error.message });
  }
});

// 5. Get Video Info
router.post('/info', upload.single('video'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Please upload a video' });
    }

    const metadata = await new Promise((resolve, reject) => {
      ffmpeg.ffprobe(req.file.path, (err, data) => {
        if (err) reject(err);
        else resolve(data);
      });
    });
    
    await cleanup(req.file);
    
    res.json({
      filename: req.file.originalname,
      size: req.file.size,
      format: metadata.format,
      streams: metadata.streams,
      duration: metadata.format.duration,
      bitrate: metadata.format.bit_rate
    });
  } catch (error) {
    await cleanup(req.file);
    console.error('Info error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;