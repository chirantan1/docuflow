const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const { v4: uuidv4 } = require('uuid');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads/images'));
  },
  filename: (req, file, cb) => {
    const uniqueId = uuidv4();
    const ext = path.extname(file.originalname);
    cb(null, `${uniqueId}${ext}`);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/bmp', 'image/tiff'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
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

// 1. Resize Image
router.post('/resize', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Please upload an image' });
    }

    const width = parseInt(req.body.width) || 800;
    const height = parseInt(req.body.height) || 600;
    const fit = req.body.fit || 'cover';
    
    const outputPath = path.join(__dirname, '../uploads/images', `resized_${uuidv4()}.jpg`);
    
    await sharp(req.file.path)
      .resize(width, height, { fit: fit })
      .toFile(outputPath);
    
    await cleanup(req.file);
    
    res.download(outputPath, 'resized.jpg', (err) => {
      if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
    });
  } catch (error) {
    await cleanup(req.file);
    console.error('Resize error:', error);
    res.status(500).json({ error: error.message });
  }
});

// 2. Compress Image
router.post('/compress', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Please upload an image' });
    }

    const quality = parseInt(req.body.quality) || 80;
    const outputPath = path.join(__dirname, '../uploads/images', `compressed_${uuidv4()}.jpg`);
    
    await sharp(req.file.path)
      .jpeg({ quality: quality })
      .toFile(outputPath);
    
    await cleanup(req.file);
    
    res.download(outputPath, 'compressed.jpg', (err) => {
      if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
    });
  } catch (error) {
    await cleanup(req.file);
    console.error('Compress error:', error);
    res.status(500).json({ error: error.message });
  }
});

// 3. Convert Image Format
router.post('/convert', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Please upload an image' });
    }

    const format = req.body.format || 'png';
    const outputPath = path.join(__dirname, '../uploads/images', `converted_${uuidv4()}.${format}`);
    
    await sharp(req.file.path)
      .toFormat(format)
      .toFile(outputPath);
    
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

// 4. Rotate Image
router.post('/rotate', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Please upload an image' });
    }

    const degrees = parseInt(req.body.degrees) || 90;
    const outputPath = path.join(__dirname, '../uploads/images', `rotated_${uuidv4()}.jpg`);
    
    await sharp(req.file.path)
      .rotate(degrees)
      .toFile(outputPath);
    
    await cleanup(req.file);
    
    res.download(outputPath, 'rotated.jpg', (err) => {
      if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
    });
  } catch (error) {
    await cleanup(req.file);
    console.error('Rotate error:', error);
    res.status(500).json({ error: error.message });
  }
});

// 5. Add Watermark
router.post('/watermark', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Please upload an image' });
    }

    const text = req.body.text || 'WATERMARK';
    const outputPath = path.join(__dirname, '../uploads/images', `watermarked_${uuidv4()}.jpg`);
    
    // Use sharp to add text watermark
    const image = sharp(req.file.path);
    const metadata = await image.metadata();
    
    // Create a watermark overlay
    const watermarkImage = sharp({
      create: {
        width: metadata.width,
        height: metadata.height,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      }
    });
    
    // For text watermark, we need to use a different approach
    // Since sharp doesn't support text drawing directly, we'll use composite
    // For now, just return the original with a note
    await cleanup(req.file);
    
    res.json({ 
      message: 'Watermark feature coming soon. Using sharp for image processing.',
      filename: req.file.originalname 
    });
  } catch (error) {
    await cleanup(req.file);
    console.error('Watermark error:', error);
    res.status(500).json({ error: error.message });
  }
});

// 6. Create Thumbnail
router.post('/thumbnail', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Please upload an image' });
    }

    const width = parseInt(req.body.width) || 200;
    const height = parseInt(req.body.height) || 200;
    const outputPath = path.join(__dirname, '../uploads/thumbnails', `thumb_${uuidv4()}.jpg`);
    
    await sharp(req.file.path)
      .resize(width, height, { fit: 'cover' })
      .toFile(outputPath);
    
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

// 7. Get Image Info
router.post('/info', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Please upload an image' });
    }

    const metadata = await sharp(req.file.path).metadata();
    await cleanup(req.file);
    
    res.json({
      width: metadata.width,
      height: metadata.height,
      format: metadata.format,
      size: req.file.size,
      filename: req.file.originalname,
      hasAlpha: metadata.hasAlpha,
      channels: metadata.channels,
      space: metadata.space
    });
  } catch (error) {
    await cleanup(req.file);
    console.error('Info error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;