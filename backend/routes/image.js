const express = require('express');
const multer = require('multer');
const fs = require('fs');
const sharp = require('sharp');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => {
    cb(null, `${uuidv4()}-${file.originalname}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

const cleanup = (file) => {
  try {
    if (file && fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }
  } catch (e) {}
};

router.post('/convert', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Please upload an image' });
    }

    const { format } = req.body;
    if (!format) {
      return res.status(400).json({ error: 'Target format is required' });
    }

    const outputPath = `${req.file.path}.${format}`;
    await sharp(req.file.path).toFormat(format).toFile(outputPath);
    const result = fs.readFileSync(outputPath);

    cleanup(req.file);
    try { fs.unlinkSync(outputPath); } catch(e) {}

    res.setHeader('Content-Type', `image/${format}`);
    res.setHeader('Content-Disposition', `attachment; filename=converted.${format}`);
    res.send(result);

  } catch (error) {
    cleanup(req.file);
    res.status(500).json({ error: error.message });
  }
});

router.post('/compress', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Please upload an image' });
    }

    const quality = parseInt(req.body.quality) || 80;
    const outputPath = `${req.file.path}.compressed`;
    await sharp(req.file.path).jpeg({ quality }).png({ quality }).toFile(outputPath);
    const result = fs.readFileSync(outputPath);

    const ext = req.file.originalname.split('.').pop();
    cleanup(req.file);
    try { fs.unlinkSync(outputPath); } catch(e) {}

    res.setHeader('Content-Type', req.file.mimetype);
    res.setHeader('Content-Disposition', `attachment; filename=compressed.${ext}`);
    res.send(result);

  } catch (error) {
    cleanup(req.file);
    res.status(500).json({ error: error.message });
  }
});

router.post('/resize', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Please upload an image' });
    }

    const { width, height } = req.body;
    if (!width || !height) {
      return res.status(400).json({ error: 'Width and height are required' });
    }

    const outputPath = `${req.file.path}.resized`;
    await sharp(req.file.path).resize(parseInt(width), parseInt(height)).toFile(outputPath);
    const result = fs.readFileSync(outputPath);

    const ext = req.file.originalname.split('.').pop();
    cleanup(req.file);
    try { fs.unlinkSync(outputPath); } catch(e) {}

    res.setHeader('Content-Type', req.file.mimetype);
    res.setHeader('Content-Disposition', `attachment; filename=resized.${ext}`);
    res.send(result);

  } catch (error) {
    cleanup(req.file);
    res.status(500).json({ error: error.message });
  }
});

router.post('/crop', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Please upload an image' });
    }

    const { left, top, width, height } = req.body;
    if (left === undefined || top === undefined || !width || !height) {
      return res.status(400).json({ error: 'All crop parameters are required' });
    }

    const outputPath = `${req.file.path}.cropped`;
    await sharp(req.file.path).extract({
      left: parseInt(left),
      top: parseInt(top),
      width: parseInt(width),
      height: parseInt(height)
    }).toFile(outputPath);
    const result = fs.readFileSync(outputPath);

    const ext = req.file.originalname.split('.').pop();
    cleanup(req.file);
    try { fs.unlinkSync(outputPath); } catch(e) {}

    res.setHeader('Content-Type', req.file.mimetype);
    res.setHeader('Content-Disposition', `attachment; filename=cropped.${ext}`);
    res.send(result);

  } catch (error) {
    cleanup(req.file);
    res.status(500).json({ error: error.message });
  }
});

router.post('/rotate', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Please upload an image' });
    }

    const degrees = parseInt(req.body.degrees) || 90;
    const outputPath = `${req.file.path}.rotated`;
    await sharp(req.file.path).rotate(degrees).toFile(outputPath);
    const result = fs.readFileSync(outputPath);

    const ext = req.file.originalname.split('.').pop();
    cleanup(req.file);
    try { fs.unlinkSync(outputPath); } catch(e) {}

    res.setHeader('Content-Type', req.file.mimetype);
    res.setHeader('Content-Disposition', `attachment; filename=rotated.${ext}`);
    res.send(result);

  } catch (error) {
    cleanup(req.file);
    res.status(500).json({ error: error.message });
  }
});

router.post('/grayscale', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Please upload an image' });
    }

    const outputPath = `${req.file.path}.grayscale`;
    await sharp(req.file.path).grayscale().toFile(outputPath);
    const result = fs.readFileSync(outputPath);

    const ext = req.file.originalname.split('.').pop();
    cleanup(req.file);
    try { fs.unlinkSync(outputPath); } catch(e) {}

    res.setHeader('Content-Type', req.file.mimetype);
    res.setHeader('Content-Disposition', `attachment; filename=grayscale.${ext}`);
    res.send(result);

  } catch (error) {
    cleanup(req.file);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
