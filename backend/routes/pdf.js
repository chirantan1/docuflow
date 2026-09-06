const express = require('express');
const multer = require('multer');
const fs = require('fs');
const { PDFDocument } = require('pdf-lib');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, uuidv4() + '.pdf');
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 100 * 1024 * 1024 },
  fileFilter: function (req, file, cb) {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'));
    }
  }
});

function cleanup(files) {
  if (Array.isArray(files)) {
    files.forEach(function (file) {
      try {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      } catch (e) {
        // ignore
      }
    });
  } else if (files) {
    try {
      if (fs.existsSync(files.path)) {
        fs.unlinkSync(files.path);
      }
    } catch (e) {
      // ignore
    }
  }
}

// MERGE PDF
router.post('/merge', upload.array('files', 10), async function (req, res) {
  console.log('Merge: ' + (req.files ? req.files.length : 0) + ' files');
  
  try {
    if (!req.files || req.files.length < 2) {
      cleanup(req.files);
      return res.status(400).json({ error: 'Please upload at least 2 PDF files' });
    }

    const mergedPdf = await PDFDocument.create();
    
    for (var i = 0; i < req.files.length; i++) {
      var file = req.files[i];
      try {
        console.log('Reading: ' + file.originalname);
        var pdfBytes = fs.readFileSync(file.path);
        var pdf;
        try {
          pdf = await PDFDocument.load(pdfBytes);
        } catch (loadError) {
          console.log('File ' + file.originalname + ' is encrypted, trying to ignore encryption...');
          pdf = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
        }
        var indices = pdf.getPageIndices();
        var copiedPages = await mergedPdf.copyPages(pdf, indices);
        copiedPages.forEach(function (page) { mergedPdf.addPage(page); });
      } catch (fileError) {
        console.error('Error processing ' + file.originalname + ': ' + fileError.message);
      }
    }
    
    var result = await mergedPdf.save();
    cleanup(req.files);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=merged.pdf');
    res.send(result);
    console.log('Merge complete!');
    
  } catch (error) {
    cleanup(req.files);
    console.error('Merge error:', error);
    res.status(500).json({ error: error.message });
  }
});

// COMPRESS PDF
router.post('/compress', upload.single('file'), async function (req, res) {
  console.log('Compress request');
  
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Please upload a PDF file' });
    }

    console.log('Reading: ' + req.file.originalname);
    var pdfBytes = fs.readFileSync(req.file.path);
    var pdf;
    try {
      pdf = await PDFDocument.load(pdfBytes);
    } catch (loadError) {
      pdf = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
    }
    var result = await pdf.save();
    
    cleanup(req.file);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=compressed.pdf');
    res.send(result);
    console.log('Compress complete!');
    
  } catch (error) {
    cleanup(req.file);
    console.error('Compress error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ROTATE PDF
router.post('/rotate', upload.single('file'), async function (req, res) {
  console.log('Rotate request');
  
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Please upload a PDF file' });
    }

    var degrees = parseInt(req.body.degrees) || 90;
    console.log('Reading: ' + req.file.originalname + ', Rotate: ' + degrees + 'deg');
    
    var pdfBytes = fs.readFileSync(req.file.path);
    var pdf;
    try {
      pdf = await PDFDocument.load(pdfBytes);
    } catch (loadError) {
      pdf = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
    }
    var pages = pdf.getPages();
    
    for (var i = 0; i < pages.length; i++) {
      pages[i].setRotation(degrees);
    }
    
    var result = await pdf.save();
    cleanup(req.file);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=rotated.pdf');
    res.send(result);
    console.log('Rotate complete!');
    
  } catch (error) {
    cleanup(req.file);
    console.error('Rotate error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ADD WATERMARK
router.post('/watermark', upload.single('file'), async function (req, res) {
  console.log('Watermark request');
  
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Please upload a PDF file' });
    }

    var text = req.body.text || 'CONFIDENTIAL';
    console.log('Reading: ' + req.file.originalname + ', Text: ' + text);
    
    var pdfBytes = fs.readFileSync(req.file.path);
    var pdf;
    try {
      pdf = await PDFDocument.load(pdfBytes);
    } catch (loadError) {
      pdf = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
    }
    var pages = pdf.getPages();
    
    for (var i = 0; i < pages.length; i++) {
      var page = pages[i];
      var width = page.getSize().width;
      var height = page.getSize().height;
      page.drawText(text, {
        x: width / 2 - 100,
        y: height / 2,
        size: 60,
        opacity: 0.3,
        color: { r: 0.5, g: 0.5, b: 0.5 },
        rotate: Math.PI / 4
      });
    }
    
    var result = await pdf.save();
    cleanup(req.file);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=watermarked.pdf');
    res.send(result);
    console.log('Watermark complete!');
    
  } catch (error) {
    cleanup(req.file);
    console.error('Watermark error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ADD PAGE NUMBERS
router.post('/pagenumbers', upload.single('file'), async function (req, res) {
  console.log('Page numbers request');
  
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Please upload a PDF file' });
    }

    console.log('Reading: ' + req.file.originalname);
    var pdfBytes = fs.readFileSync(req.file.path);
    var pdf;
    try {
      pdf = await PDFDocument.load(pdfBytes);
    } catch (loadError) {
      pdf = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
    }
    var pages = pdf.getPages();
    
    for (var i = 0; i < pages.length; i++) {
      var page = pages[i];
      var width = page.getSize().width;
      var height = page.getSize().height;
      page.drawText('Page ' + (i + 1), {
        x: width / 2 - 20,
        y: 30,
        size: 10,
        color: { r: 0, g: 0, b: 0 }
      });
    }
    
    var result = await pdf.save();
    cleanup(req.file);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=numbered.pdf');
    res.send(result);
    console.log('Page numbers complete!');
    
  } catch (error) {
    cleanup(req.file);
    console.error('Page numbers error:', error);
    res.status(500).json({ error: error.message });
  }
});

// PROTECT PDF
router.post('/protect', upload.single('file'), async function (req, res) {
  console.log('Protect request');
  
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Please upload a PDF file' });
    }

    var password = req.body.password || 'password123';
    console.log('Reading: ' + req.file.originalname);
    
    var pdfBytes = fs.readFileSync(req.file.path);
    var pdf;
    try {
      pdf = await PDFDocument.load(pdfBytes);
    } catch (loadError) {
      pdf = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
    }
    
    pdf.encrypt({
      userPassword: password,
      ownerPassword: password,
      permissions: {
        printing: 'highResolution',
        modifying: false,
        copying: false
      }
    });
    
    var result = await pdf.save();
    cleanup(req.file);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=protected.pdf');
    res.send(result);
    console.log('Protect complete!');
    
  } catch (error) {
    cleanup(req.file);
    console.error('Protect error:', error);
    res.status(500).json({ error: error.message });
  }
});

// SPLIT PDF
router.post('/split', upload.single('file'), async function (req, res) {
  console.log('Split request');
  
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Please upload a PDF file' });
    }

    console.log('Reading: ' + req.file.originalname);
    var pdfBytes = fs.readFileSync(req.file.path);
    var sourcePdf;
    try {
      sourcePdf = await PDFDocument.load(pdfBytes);
    } catch (loadError) {
      sourcePdf = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
    }
    var totalPages = sourcePdf.getPageCount();
    
    console.log('Total pages: ' + totalPages);
    
    var newPdf = await PDFDocument.create();
    var firstPage = await newPdf.copyPages(sourcePdf, [0]);
    newPdf.addPage(firstPage[0]);
    var result = await newPdf.save();
    
    cleanup(req.file);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=split_page_1.pdf');
    res.send(result);
    console.log('Split complete!');
    
  } catch (error) {
    cleanup(req.file);
    console.error('Split error:', error);
    res.status(500).json({ error: error.message });
  }
});

// EXTRACT PAGES
router.post('/extract', upload.single('file'), async function (req, res) {
  console.log('Extract request');
  
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Please upload a PDF file' });
    }

    var pages = JSON.parse(req.body.pages || '[0]');
    console.log('Reading: ' + req.file.originalname + ', Pages: ' + pages.join(', '));
    
    var pdfBytes = fs.readFileSync(req.file.path);
    var sourcePdf;
    try {
      sourcePdf = await PDFDocument.load(pdfBytes);
    } catch (loadError) {
      sourcePdf = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
    }
    var newPdf = await PDFDocument.create();
    
    var copiedPages = await newPdf.copyPages(sourcePdf, pages);
    copiedPages.forEach(function (page) { newPdf.addPage(page); });
    
    var result = await newPdf.save();
    cleanup(req.file);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=extracted.pdf');
    res.send(result);
    console.log('Extract complete!');
    
  } catch (error) {
    cleanup(req.file);
    console.error('Extract error:', error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE PAGES
router.post('/delete', upload.single('file'), async function (req, res) {
  console.log('Delete request');
  
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Please upload a PDF file' });
    }

    var pages = JSON.parse(req.body.pages || '[]');
    console.log('Reading: ' + req.file.originalname + ', Delete: ' + pages.join(', '));
    
    var pdfBytes = fs.readFileSync(req.file.path);
    var pdf;
    try {
      pdf = await PDFDocument.load(pdfBytes);
    } catch (loadError) {
      pdf = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
    }
    
    var sortedPages = pages.slice().sort(function (a, b) { return b - a; });
    
    for (var i = 0; i < sortedPages.length; i++) {
      var pageNum = sortedPages[i];
      if (pageNum < pdf.getPageCount()) {
        pdf.removePage(pageNum);
      }
    }
    
    var result = await pdf.save();
    cleanup(req.file);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=modified.pdf');
    res.send(result);
    console.log('Delete complete!');
    
  } catch (error) {
    cleanup(req.file);
    console.error('Delete error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
