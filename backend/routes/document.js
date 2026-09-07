const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const mammoth = require('mammoth');
const PDFDocument = require('pdfkit');
const { Document, Packer, Paragraph, TextRun } = require('docx');
const XLSX = require('xlsx');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads/documents'));
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
    const allowedTypes = [
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain'
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only document files are allowed'), false);
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

// 1. Convert Word to PDF
router.post('/word-to-pdf', upload.single('document'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Please upload a Word document' });
    }

    const outputPath = path.join(__dirname, '../uploads/documents', `converted_${uuidv4()}.pdf`);
    
    // Convert docx to html
    const result = await mammoth.convertToHtml({ path: req.file.path });
    const html = result.value;
    
    // Create PDF from HTML
    const doc = new PDFDocument();
    const writeStream = fs.createWriteStream(outputPath);
    doc.pipe(writeStream);
    doc.text(html.replace(/<[^>]*>/g, ''), {
      align: 'left',
      width: 500
    });
    doc.end();
    
    await new Promise((resolve) => writeStream.on('finish', resolve));
    await cleanup(req.file);
    
    res.download(outputPath, 'converted.pdf', (err) => {
      if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
    });
  } catch (error) {
    await cleanup(req.file);
    console.error('Word to PDF error:', error);
    res.status(500).json({ error: error.message });
  }
});

// 2. Convert Excel to JSON
router.post('/excel-to-json', upload.single('document'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Please upload an Excel file' });
    }

    const workbook = XLSX.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);
    
    await cleanup(req.file);
    
    res.json(data);
  } catch (error) {
    await cleanup(req.file);
    console.error('Excel to JSON error:', error);
    res.status(500).json({ error: error.message });
  }
});

// 3. JSON to Excel
router.post('/json-to-excel', express.json(), async (req, res) => {
  try {
    const data = req.body.data || [];
    if (!data || data.length === 0) {
      return res.status(400).json({ error: 'Please provide valid JSON data' });
    }

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
    
    const outputPath = path.join(__dirname, '../uploads/documents', `excel_${uuidv4()}.xlsx`);
    XLSX.writeFile(workbook, outputPath);
    
    res.download(outputPath, 'data.xlsx', (err) => {
      if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
    });
  } catch (error) {
    console.error('JSON to Excel error:', error);
    res.status(500).json({ error: error.message });
  }
});

// 4. Merge Text Files
router.post('/merge-text', upload.array('files', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length < 2) {
      await cleanup(req.files);
      return res.status(400).json({ error: 'Please upload at least 2 text files' });
    }

    const outputPath = path.join(__dirname, '../uploads/documents', `merged_${uuidv4()}.txt`);
    const writeStream = fs.createWriteStream(outputPath);
    
    for (const file of req.files) {
      const content = await fs.promises.readFile(file.path, 'utf8');
      writeStream.write(content);
      writeStream.write('\n\n--- Next File ---\n\n');
    }
    
    writeStream.end();
    await new Promise((resolve) => writeStream.on('finish', resolve));
    await cleanup(req.files);
    
    res.download(outputPath, 'merged.txt', (err) => {
      if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
    });
  } catch (error) {
    await cleanup(req.files);
    console.error('Merge text error:', error);
    res.status(500).json({ error: error.message });
  }
});

// 5. Text to PDF
router.post('/text-to-pdf', upload.single('document'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Please upload a text file' });
    }

    const content = await fs.promises.readFile(req.file.path, 'utf8');
    const outputPath = path.join(__dirname, '../uploads/documents', `pdf_${uuidv4()}.pdf`);
    
    const doc = new PDFDocument();
    const writeStream = fs.createWriteStream(outputPath);
    doc.pipe(writeStream);
    doc.text(content, {
      align: 'left',
      width: 500
    });
    doc.end();
    
    await new Promise((resolve) => writeStream.on('finish', resolve));
    await cleanup(req.file);
    
    res.download(outputPath, 'converted.pdf', (err) => {
      if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
    });
  } catch (error) {
    await cleanup(req.file);
    console.error('Text to PDF error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;