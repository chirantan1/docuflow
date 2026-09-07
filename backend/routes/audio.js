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
    cb(null, path.join(__dirname, '../uploads/audio'));
  },
  filename: (req, file, cb) => {
    const uniqueId = uuidv4();
    const ext = path.extname(file.originalname);
    cb(null, `${uniqueId}${ext}`);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 200 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/aac', 'audio/mp3'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only audio files are allowed'), false);
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

// 1. Convert Audio Format
router.post('/convert', upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Please upload an audio file' });
    }

    const format = req.body.format || 'mp3';
    const outputPath = path.join(__dirname, '../uploads/audio', `converted_${uuidv4()}.${format}`);
    
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

// 2. Trim Audio
router.post('/trim', upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Please upload an audio file' });
    }

    const startTime = req.body.startTime || '00:00:00';
    const duration = req.body.duration || '00:00:30';
    const outputPath = path.join(__dirname, '../uploads/audio', `trimmed_${uuidv4()}.mp3`);
    
    await new Promise((resolve, reject) => {
      ffmpeg(req.file.path)
        .setStartTime(startTime)
        .duration(duration)
        .on('end', resolve)
        .on('error', reject)
        .save(outputPath);
    });
    
    await cleanup(req.file);
    
    res.download(outputPath, 'trimmed.mp3', (err) => {
      if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
    });
  } catch (error) {
    await cleanup(req.file);
    console.error('Trim error:', error);
    res.status(500).json({ error: error.message });
  }
});

// 3. Compress Audio
router.post('/compress', upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Please upload an audio file' });
    }

    const bitrate = req.body.bitrate || '128k';
    const outputPath = path.join(__dirname, '../uploads/audio', `compressed_${uuidv4()}.mp3`);
    
    await new Promise((resolve, reject) => {
      ffmpeg(req.file.path)
        .audioBitrate(bitrate)
        .toFormat('mp3')
        .on('end', resolve)
        .on('error', reject)
        .save(outputPath);
    });
    
    await cleanup(req.file);
    
    res.download(outputPath, 'compressed.mp3', (err) => {
      if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
    });
  } catch (error) {
    await cleanup(req.file);
    console.error('Compress error:', error);
    res.status(500).json({ error: error.message });
  }
});

// 4. Get Audio Info
router.post('/info', upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Please upload an audio file' });
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