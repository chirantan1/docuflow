const { PDFDocument, rgb } = require('pdf-lib');
const fs = require('fs').promises;

class PDFService {
  // Merge PDFs
  async merge(files) {
    try {
      const mergedPdf = await PDFDocument.create();
      
      for (const file of files) {
        const pdfBytes = await fs.readFile(file.path);
        const pdf = await PDFDocument.load(pdfBytes);
        const indices = pdf.getPageIndices();
        const copiedPages = await mergedPdf.copyPages(pdf, indices);
        copiedPages.forEach(page => mergedPdf.addPage(page));
      }
      
      return await mergedPdf.save();
    } catch (error) {
      throw new Error(`Merge failed: ${error.message}`);
    }
  }

  // Split PDF
  async split(file, ranges = null) {
    try {
      const pdfBytes = await fs.readFile(file.path);
      const sourcePdf = await PDFDocument.load(pdfBytes);
      const totalPages = sourcePdf.getPageCount();
      
      const splits = [];
      const pageRanges = ranges || Array.from({ length: totalPages }, (_, i) => [i]);
      
      for (const range of pageRanges) {
        const newPdf = await PDFDocument.create();
        const pages = Array.isArray(range) ? range : [range];
        const validPages = pages.filter(p => p < totalPages);
        
        if (validPages.length === 0) continue;
        
        const copiedPages = await newPdf.copyPages(sourcePdf, validPages);
        copiedPages.forEach(page => newPdf.addPage(page));
        splits.push(await newPdf.save());
      }
      
      return splits;
    } catch (error) {
      throw new Error(`Split failed: ${error.message}`);
    }
  }

  // Compress PDF
  async compress(file) {
    try {
      const pdfBytes = await fs.readFile(file.path);
      const pdf = await PDFDocument.load(pdfBytes);
      return await pdf.save();
    } catch (error) {
      throw new Error(`Compress failed: ${error.message}`);
    }
  }

  // Add watermark
  async addWatermark(file, watermarkText, opacity = 0.3) {
    try {
      const pdfBytes = await fs.readFile(file.path);
      const pdf = await PDFDocument.load(pdfBytes);
      const pages = pdf.getPages();
      
      for (const page of pages) {
        const { width, height } = page.getSize();
        page.drawText(watermarkText, {
          x: width / 2 - 100,
          y: height / 2,
          size: 60,
          opacity,
          color: rgb(0.5, 0.5, 0.5),
          rotate: Math.PI / 4
        });
      }
      
      return await pdf.save();
    } catch (error) {
      throw new Error(`Add watermark failed: ${error.message}`);
    }
  }

  // Add page numbers
  async addPageNumbers(file) {
    try {
      const pdfBytes = await fs.readFile(file.path);
      const pdf = await PDFDocument.load(pdfBytes);
      const pages = pdf.getPages();
      
      for (let i = 0; i < pages.length; i++) {
        const page = pages[i];
        const { width, height } = page.getSize();
        page.drawText(`Page ${i + 1}`, {
          x: width / 2 - 20,
          y: 30,
          size: 10,
          color: rgb(0, 0, 0)
        });
      }
      
      return await pdf.save();
    } catch (error) {
      throw new Error(`Add page numbers failed: ${error.message}`);
    }
  }

  // Protect PDF with password
  async protect(file, password) {
    try {
      const pdfBytes = await fs.readFile(file.path);
      const pdf = await PDFDocument.load(pdfBytes);
      
      pdf.encrypt({
        userPassword: password,
        ownerPassword: password,
        permissions: {
          printing: 'highResolution',
          modifying: false,
          copying: false
        }
      });
      
      return await pdf.save();
    } catch (error) {
      throw new Error(`Protect failed: ${error.message}`);
    }
  }

  // Extract pages
  async extractPages(file, pageNumbers) {
    try {
      const pdfBytes = await fs.readFile(file.path);
      const sourcePdf = await PDFDocument.load(pdfBytes);
      const newPdf = await PDFDocument.create();
      
      const pages = await newPdf.copyPages(sourcePdf, pageNumbers);
      pages.forEach(page => newPdf.addPage(page));
      
      return await newPdf.save();
    } catch (error) {
      throw new Error(`Extract pages failed: ${error.message}`);
    }
  }

  // Rotate pages
  async rotatePages(file, rotation) {
    try {
      const pdfBytes = await fs.readFile(file.path);
      const pdf = await PDFDocument.load(pdfBytes);
      const pages = pdf.getPages();
      
      for (const page of pages) {
        page.setRotation(rotation);
      }
      
      return await pdf.save();
    } catch (error) {
      throw new Error(`Rotate pages failed: ${error.message}`);
    }
  }

  // Delete pages
  async deletePages(file, pageNumbers) {
    try {
      const pdfBytes = await fs.readFile(file.path);
      const pdf = await PDFDocument.load(pdfBytes);
      const sortedPages = pageNumbers.sort((a, b) => b - a);
      
      for (const pageNum of sortedPages) {
        if (pageNum < pdf.getPageCount()) {
          pdf.removePage(pageNum);
        }
      }
      
      return await pdf.save();
    } catch (error) {
      throw new Error(`Delete pages failed: ${error.message}`);
    }
  }

  // Convert PDF to images (placeholder)
  async toImages(file) {
    // This would use pdf.js for rendering
    return "PDF to images conversion would go here";
  }

  // Extract text from PDF (placeholder)
  async extractText(file) {
    // This would use pdf.js for text extraction
    return "Text extraction would go here using pdf.js";
  }
}

module.exports = new PDFService();