const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { PDFDocument, degrees, rgb } = require('pdf-lib');


// ============================================================
// CONFIGURATION
// ============================================================

const UPLOAD_DIR = path.join(__dirname, '../uploads/pdf');


// ============================================================
// CREATE UPLOAD DIRECTORY
// ============================================================

if (!fsSync.existsSync(UPLOAD_DIR)) {
    fsSync.mkdirSync(UPLOAD_DIR, { recursive: true });
    console.log(`📁 Created PDF upload directory: ${UPLOAD_DIR}`);
}


// ============================================================
// MULTER CONFIGURATION
// ============================================================

const storage = multer.diskStorage({

    destination: (req, file, cb) => {
        cb(null, UPLOAD_DIR);
    },

    filename: (req, file, cb) => {

        const uniqueId = uuidv4();

        const sanitizedName = file.originalname
            .replace(/[^a-zA-Z0-9.]/g, '_');

        cb(
            null,
            `${uniqueId}_${sanitizedName}`
        );
    }
});


const upload = multer({

    storage: storage,

    limits: {
        fileSize: 100 * 1024 * 1024,
        files: 20
    },

    fileFilter: (req, file, cb) => {

        if (file.mimetype === 'application/pdf') {
            cb(null, true);
        } else {
            cb(
                new Error('Only PDF files are allowed'),
                false
            );
        }
    }

});


// ============================================================
// CLEANUP UPLOADED FILES
// ============================================================

const cleanupFiles = async (files) => {

    if (!files) return;

    const filesToDelete = Array.isArray(files)
        ? files
        : [files];

    for (const file of filesToDelete) {

        if (!file || !file.path) {
            continue;
        }

        try {

            await fs.unlink(file.path);

            console.log(
                `🗑️ Deleted: ${path.basename(file.path)}`
            );

        } catch (error) {

            // Ignore missing files

        }

    }

};


// ============================================================
// TEST ENDPOINT
// ============================================================

router.get('/test', (req, res) => {

    res.json({

        message: '✅ PDF API is working',

        timestamp: new Date().toISOString(),

        uploadDir: UPLOAD_DIR

    });

});


// ============================================================
// MERGE PDF
// ============================================================
//
// POST /api/pdf/merge
//
// FormData:
//
// files = PDF 1
// files = PDF 2
// files = PDF 3
//
// ============================================================

router.post(
    '/merge',
    upload.array('files', 20),
    async (req, res) => {

        const uploadedFiles = req.files;

        console.log('\n====================================');
        console.log('        MERGE PDF REQUEST');
        console.log('====================================');

        console.log(
            'Files received:',
            uploadedFiles
                ? uploadedFiles.length
                : 0
        );

        try {

            // ------------------------------------------------
            // Validate files
            // ------------------------------------------------

            if (
                !uploadedFiles ||
                uploadedFiles.length === 0
            ) {

                return res.status(400).json({
                    error: 'No PDF files uploaded'
                });

            }


            if (uploadedFiles.length < 2) {

                await cleanupFiles(uploadedFiles);

                return res.status(400).json({
                    error: 'Please upload at least 2 PDF files'
                });

            }


            // ------------------------------------------------
            // Log uploaded files
            // ------------------------------------------------

            uploadedFiles.forEach((file, index) => {

                console.log(
                    `File ${index + 1}:`,
                    file.originalname
                );

                console.log(
                    `Size: ${file.size} bytes`
                );

            });


            // ------------------------------------------------
            // Create empty PDF
            // ------------------------------------------------

            const mergedPdf =
                await PDFDocument.create();


            let totalPagesAdded = 0;

            const successfulFiles = [];

            const errors = [];


            // ------------------------------------------------
            // Process each PDF
            // ------------------------------------------------

            for (
                let fileIndex = 0;
                fileIndex < uploadedFiles.length;
                fileIndex++
            ) {

                const file =
                    uploadedFiles[fileIndex];


                console.log('\n------------------------------------');

                console.log(
                    `📄 Processing ${fileIndex + 1}/${uploadedFiles.length}`
                );

                console.log(
                    `Name: ${file.originalname}`
                );


                try {

                    // ----------------------------------------
                    // Read PDF
                    // ----------------------------------------

                    const fileBuffer =
                        await fs.readFile(file.path);


                    if (fileBuffer.length < 100) {

                        throw new Error(
                            'PDF file is too small or corrupted'
                        );

                    }


                    // ----------------------------------------
                    // Load source PDF
                    // ----------------------------------------

                    const sourcePdf =
                        await PDFDocument.load(
                            fileBuffer,
                            {
                                ignoreEncryption: true,
                                updateMetadata: false
                            }
                        );


                    const pageCount =
                        sourcePdf.getPageCount();


                    console.log(
                        `Pages found: ${pageCount}`
                    );


                    if (pageCount === 0) {

                        throw new Error(
                            'PDF contains no pages'
                        );

                    }


                    // ----------------------------------------
                    // IMPORTANT
                    // ----------------------------------------
                    //
                    // Embed every page separately.
                    //
                    // This avoids several rendering/resource
                    // problems that can occur when directly
                    // copying pages between PDF documents.
                    //
                    // ----------------------------------------

                    const pageIndices =
                        Array.from(
                            { length: pageCount },
                            (_, index) => index
                        );


                    const embeddedPages =
                        await mergedPdf.embedPdf(
                            fileBuffer,
                            pageIndices
                        );


                    console.log(
                        `Embedded pages: ${embeddedPages.length}`
                    );


                    // ----------------------------------------
                    // Add each page
                    // ----------------------------------------

                    for (
                        let pageIndex = 0;
                        pageIndex < embeddedPages.length;
                        pageIndex++
                    ) {

                        const embeddedPage =
                            embeddedPages[pageIndex];


                        const size =
                            embeddedPage.scale(1);


                        const width =
                            size.width;


                        const height =
                            size.height;


                        console.log(
                            `Adding page ${pageIndex + 1}:`,
                            `${width} x ${height}`
                        );


                        // Create page with EXACT
                        // source page dimensions

                        const newPage =
                            mergedPdf.addPage([
                                width,
                                height
                            ]);


                        // Draw source page
                        // exactly inside new page

                        newPage.drawPage(
                            embeddedPage,
                            {
                                x: 0,
                                y: 0,
                                width: width,
                                height: height
                            }
                        );


                        totalPagesAdded++;

                    }


                    successfulFiles.push(
                        file.originalname
                    );


                    console.log(
                        `✅ Successfully added ${pageCount} page(s)`
                    );


                } catch (fileError) {

                    console.error(
                        `❌ Error processing ${file.originalname}:`,
                        fileError.message
                    );


                    errors.push(
                        `${file.originalname}: ${fileError.message}`
                    );

                }

            }


            // ------------------------------------------------
            // Validate result
            // ------------------------------------------------

            console.log('\n====================================');

            console.log(
                `Total pages added: ${totalPagesAdded}`
            );

            console.log(
                `Successful files: ${successfulFiles.length}`
            );


            if (errors.length > 0) {

                console.log(
                    'Errors:',
                    errors
                );

            }


            console.log('====================================');


            if (totalPagesAdded === 0) {

                await cleanupFiles(uploadedFiles);

                return res.status(400).json({

                    error:
                        'No valid pages found in uploaded PDFs',

                    details:
                        errors

                });

            }


            // ------------------------------------------------
            // Save merged PDF
            // ------------------------------------------------

            console.log(
                '💾 Saving merged PDF...'
            );


            const mergedPdfBytes =
                await mergedPdf.save({

                    useObjectStreams: false,

                    addDefaultPage: false

                });


            console.log(
                `✅ Merged PDF size: ${mergedPdfBytes.length} bytes`
            );


            // ------------------------------------------------
            // Cleanup source PDFs
            // ------------------------------------------------

            await cleanupFiles(
                uploadedFiles
            );


            console.log(
                '🗑️ Source files cleaned'
            );


            // ------------------------------------------------
            // Send PDF
            // ------------------------------------------------

            const fileName =
                `merged_${Date.now()}.pdf`;


            res.setHeader(
                'Content-Type',
                'application/pdf'
            );


            res.setHeader(
                'Content-Disposition',
                `attachment; filename="${fileName}"`
            );


            res.setHeader(
                'Content-Length',
                mergedPdfBytes.length
            );


            res.send(
                Buffer.from(mergedPdfBytes)
            );


            console.log(
                `\n✅ MERGE COMPLETED`
            );

            console.log(
                `Pages: ${totalPagesAdded}`
            );

            console.log(
                `Files: ${successfulFiles.length}`
            );

            console.log(
                '====================================\n'
            );


        } catch (error) {

            console.error(
                '\n❌ MERGE ERROR:',
                error
            );


            await cleanupFiles(
                uploadedFiles
            );


            if (!res.headersSent) {

                res.status(500).json({

                    error:
                        error.message ||
                        'Failed to merge PDFs'

                });

            }

        }

    }
);


// ============================================================
// SPLIT PDF
// ============================================================
//
// Currently returns the first page.
//
// POST /api/pdf/split
//
// ============================================================

router.post(
    '/split',
    upload.single('file'),
    async (req, res) => {

        const file = req.file;

        console.log('\n=== SPLIT REQUEST ===');

        try {

            if (!file) {

                return res.status(400).json({
                    error: 'Please upload a PDF file'
                });

            }


            const fileBuffer =
                await fs.readFile(file.path);


            const sourcePdf =
                await PDFDocument.load(
                    fileBuffer,
                    {
                        ignoreEncryption: true,
                        updateMetadata: false
                    }
                );


            const pageCount =
                sourcePdf.getPageCount();


            console.log(
                `Pages: ${pageCount}`
            );


            if (pageCount === 0) {

                await cleanupFiles(file);

                return res.status(400).json({
                    error: 'PDF has no pages'
                });

            }


            const newPdf =
                await PDFDocument.create();


            const [firstPage] =
                await newPdf.copyPages(
                    sourcePdf,
                    [0]
                );


            newPdf.addPage(
                firstPage
            );


            const resultBytes =
                await newPdf.save({

                    useObjectStreams: false,

                    addDefaultPage: false

                });


            await cleanupFiles(file);


            res.setHeader(
                'Content-Type',
                'application/pdf'
            );


            res.setHeader(
                'Content-Disposition',
                'attachment; filename=split_first_page.pdf'
            );


            res.setHeader(
                'Content-Length',
                resultBytes.length
            );


            res.send(
                Buffer.from(resultBytes)
            );


            console.log(
                '✅ Split completed successfully\n'
            );


        } catch (error) {

            console.error(
                '❌ Split error:',
                error
            );


            await cleanupFiles(file);


            if (!res.headersSent) {

                res.status(500).json({
                    error: error.message
                });

            }

        }

    }
);


// ============================================================
// EXTRACT PAGES
// ============================================================
//
// POST /api/pdf/extract
//
// pages = [0,1,2]
//
// ============================================================

router.post(
    '/extract',
    upload.single('file'),
    async (req, res) => {

        const file = req.file;

        console.log(
            '\n=== EXTRACT REQUEST ==='
        );


        try {

            if (!file) {

                return res.status(400).json({
                    error: 'Please upload a PDF file'
                });

            }


            let pageRanges =
                req.body.pages || '[0]';


            if (
                typeof pageRanges === 'string'
            ) {

                try {

                    pageRanges =
                        JSON.parse(pageRanges);

                } catch (error) {

                    pageRanges =
                        pageRanges
                            .split(',')
                            .map(Number);

                }

            }


            if (!Array.isArray(pageRanges)) {

                pageRanges = [
                    pageRanges
                ];

            }


            pageRanges =
                pageRanges
                    .map(Number)
                    .filter(
                        num =>
                            Number.isInteger(num) &&
                            num >= 0
                    );


            if (pageRanges.length === 0) {

                await cleanupFiles(file);

                return res.status(400).json({
                    error:
                        'No valid page numbers provided'
                });

            }


            const fileBuffer =
                await fs.readFile(file.path);


            const sourcePdf =
                await PDFDocument.load(
                    fileBuffer,
                    {
                        ignoreEncryption: true,
                        updateMetadata: false
                    }
                );


            const totalPages =
                sourcePdf.getPageCount();


            // Remove page numbers outside
            // the PDF range

            pageRanges =
                pageRanges.filter(
                    page =>
                        page < totalPages
                );


            if (pageRanges.length === 0) {

                await cleanupFiles(file);

                return res.status(400).json({
                    error:
                        'Requested pages do not exist'
                });

            }


            const newPdf =
                await PDFDocument.create();


            const copiedPages =
                await newPdf.copyPages(
                    sourcePdf,
                    pageRanges
                );


            copiedPages.forEach(
                page => {
                    newPdf.addPage(page);
                }
            );


            const resultBytes =
                await newPdf.save({

                    useObjectStreams: false,

                    addDefaultPage: false

                });


            await cleanupFiles(file);


            res.setHeader(
                'Content-Type',
                'application/pdf'
            );


            res.setHeader(
                'Content-Disposition',
                'attachment; filename=extracted.pdf'
            );


            res.setHeader(
                'Content-Length',
                resultBytes.length
            );


            res.send(
                Buffer.from(resultBytes)
            );


            console.log(
                '✅ Extract completed successfully\n'
            );


        } catch (error) {

            console.error(
                '❌ Extract error:',
                error
            );


            await cleanupFiles(file);


            if (!res.headersSent) {

                res.status(500).json({
                    error: error.message
                });

            }

        }

    }
);


// ============================================================
// GET PDF INFO
// ============================================================
//
// POST /api/pdf/info
//
// ============================================================

router.post(
    '/info',
    upload.single('file'),
    async (req, res) => {

        const file = req.file;

        console.log(
            '\n=== INFO REQUEST ==='
        );


        try {

            if (!file) {

                return res.status(400).json({
                    error: 'Please upload a PDF file'
                });

            }


            const fileBuffer =
                await fs.readFile(file.path);


            const pdf =
                await PDFDocument.load(
                    fileBuffer,
                    {
                        ignoreEncryption: true,
                        updateMetadata: false
                    }
                );


            const fileStats =
                await fs.stat(file.path);


            const info = {

                pageCount:
                    pdf.getPageCount(),

                isEncrypted:
                    pdf.isEncrypted,

                title:
                    pdf.getTitle() || 'N/A',

                author:
                    pdf.getAuthor() || 'N/A',

                subject:
                    pdf.getSubject() || 'N/A',

                creator:
                    pdf.getCreator() || 'N/A',

                producer:
                    pdf.getProducer() || 'N/A',

                fileSize:
                    fileStats.size,

                fileSizeReadable:
                    `${(
                        fileStats.size / 1024
                    ).toFixed(2)} KB`,

                fileName:
                    file.originalname,

                creationDate:
                    fileStats.birthtime,

                modifiedDate:
                    fileStats.mtime

            };


            await cleanupFiles(file);


            res.json(info);


            console.log(
                '✅ Info retrieved successfully\n'
            );


        } catch (error) {

            await cleanupFiles(file);


            console.error(
                '❌ Info error:',
                error
            );


            if (!res.headersSent) {

                res.status(500).json({
                    error: error.message
                });

            }

        }

    }
);


// ============================================================
// COMPRESS PDF
// ============================================================
//
// POST /api/pdf/compress
//
// ============================================================

router.post(
    '/compress',
    upload.single('file'),
    async (req, res) => {

        const file = req.file;

        console.log(
            '\n=== COMPRESS REQUEST ==='
        );


        try {

            if (!file) {

                return res.status(400).json({
                    error: 'Please upload a PDF file'
                });

            }


            const fileBuffer =
                await fs.readFile(file.path);


            const pdf =
                await PDFDocument.load(
                    fileBuffer,
                    {
                        ignoreEncryption: true,
                        updateMetadata: false
                    }
                );


            // Remove metadata

            pdf.setTitle('');
            pdf.setAuthor('');
            pdf.setSubject('');
            pdf.setCreator('');
            pdf.setProducer('');


            const resultBytes =
                await pdf.save({

                    useObjectStreams: true,

                    addDefaultPage: false,

                    objectsPerTick: 50

                });


            await cleanupFiles(file);


            res.setHeader(
                'Content-Type',
                'application/pdf'
            );


            res.setHeader(
                'Content-Disposition',
                'attachment; filename=compressed.pdf'
            );


            res.setHeader(
                'Content-Length',
                resultBytes.length
            );


            res.send(
                Buffer.from(resultBytes)
            );


            console.log(
                '✅ Compress completed successfully\n'
            );


        } catch (error) {

            console.error(
                '❌ Compress error:',
                error
            );


            await cleanupFiles(file);


            if (!res.headersSent) {

                res.status(500).json({
                    error: error.message
                });

            }

        }

    }
);


// ============================================================
// ADD WATERMARK
// ============================================================
//
// POST /api/pdf/watermark
//
// ============================================================

router.post(
    '/watermark',
    upload.single('file'),
    async (req, res) => {

        const file = req.file;

        console.log(
            '\n=== WATERMARK REQUEST ==='
        );


        try {

            if (!file) {

                return res.status(400).json({
                    error: 'Please upload a PDF file'
                });

            }


            const text =
                req.body.text ||
                'CONFIDENTIAL';


            const opacity =
                Math.min(
                    1,
                    Math.max(
                        0,
                        parseFloat(
                            req.body.opacity
                        ) || 0.3
                    )
                );


            const size =
                Math.min(
                    200,
                    Math.max(
                        10,
                        parseInt(
                            req.body.size
                        ) || 60
                    )
                );


            const fileBuffer =
                await fs.readFile(file.path);


            const pdf =
                await PDFDocument.load(
                    fileBuffer,
                    {
                        ignoreEncryption: true,
                        updateMetadata: false
                    }
                );


            const pages =
                pdf.getPages();


            for (const page of pages) {

                const {
                    width,
                    height
                } = page.getSize();


                const fontSize =
                    Math.min(
                        size,
                        Math.min(
                            width,
                            height
                        ) / 4
                    );


                const textWidth =
                    text.length *
                    fontSize *
                    0.6;


                page.drawText(
                    text,
                    {

                        x:
                            (width - textWidth) / 2,

                        y:
                            (height - fontSize) / 2,

                        size:
                            fontSize,

                        opacity:
                            opacity,

                        color:
                            rgb(
                                0.5,
                                0.5,
                                0.5
                            ),

                        rotate:
                            degrees(45)

                    }
                );

            }


            const resultBytes =
                await pdf.save({

                    useObjectStreams: false,

                    addDefaultPage: false

                });


            await cleanupFiles(file);


            res.setHeader(
                'Content-Type',
                'application/pdf'
            );


            res.setHeader(
                'Content-Disposition',
                'attachment; filename=watermarked.pdf'
            );


            res.setHeader(
                'Content-Length',
                resultBytes.length
            );


            res.send(
                Buffer.from(resultBytes)
            );


            console.log(
                '✅ Watermark completed successfully\n'
            );


        } catch (error) {

            console.error(
                '❌ Watermark error:',
                error
            );


            await cleanupFiles(file);


            if (!res.headersSent) {

                res.status(500).json({
                    error: error.message
                });

            }

        }

    }
);


// ============================================================
// ADD PAGE NUMBERS
// ============================================================
//
// POST /api/pdf/pagenumbers
//
// ============================================================

router.post(
    '/pagenumbers',
    upload.single('file'),
    async (req, res) => {

        const file = req.file;

        console.log(
            '\n=== PAGE NUMBERS REQUEST ==='
        );


        try {

            if (!file) {

                return res.status(400).json({
                    error: 'Please upload a PDF file'
                });

            }


            const startNumber =
                parseInt(
                    req.body.startNumber
                ) || 1;


            const position =
                req.body.position ||
                'bottom';


            const fileBuffer =
                await fs.readFile(file.path);


            const pdf =
                await PDFDocument.load(
                    fileBuffer,
                    {
                        ignoreEncryption: true,
                        updateMetadata: false
                    }
                );


            const pages =
                pdf.getPages();


            const totalPages =
                pages.length;


            for (
                let i = 0;
                i < totalPages;
                i++
            ) {

                const page =
                    pages[i];


                const {
                    width,
                    height
                } = page.getSize();


                const pageNum =
                    i + startNumber;


                const text =
                    `Page ${pageNum} of ${totalPages}`;


                const fontSize = 12;


                const textWidth =
                    text.length *
                    fontSize *
                    0.5;


                let x;
                let y;


                switch (position) {

                    case 'top':

                        x =
                            (width - textWidth) / 2;

                        y =
                            height - 40;

                        break;


                    case 'bottom':

                    default:

                        x =
                            (width - textWidth) / 2;

                        y = 30;

                        break;

                }


                page.drawText(
                    text,
                    {

                        x,
                        y,

                        size:
                            fontSize,

                        color:
                            rgb(
                                0,
                                0,
                                0
                            )

                    }
                );

            }


            const resultBytes =
                await pdf.save({

                    useObjectStreams: false,

                    addDefaultPage: false

                });


            await cleanupFiles(file);


            res.setHeader(
                'Content-Type',
                'application/pdf'
            );


            res.setHeader(
                'Content-Disposition',
                'attachment; filename=numbered.pdf'
            );


            res.setHeader(
                'Content-Length',
                resultBytes.length
            );


            res.send(
                Buffer.from(resultBytes)
            );


            console.log(
                '✅ Page numbers completed successfully\n'
            );


        } catch (error) {

            console.error(
                '❌ Page numbers error:',
                error
            );


            await cleanupFiles(file);


            if (!res.headersSent) {

                res.status(500).json({
                    error: error.message
                });

            }

        }

    }
);


// ============================================================
// ROTATE PAGES
// ============================================================
//
// POST /api/pdf/rotate
//
// degrees = 90 / 180 / 270
//
// ============================================================

router.post(
    '/rotate',
    upload.single('file'),
    async (req, res) => {

        const file = req.file;

        console.log(
            '\n=== ROTATE REQUEST ==='
        );


        try {

            if (!file) {

                return res.status(400).json({
                    error: 'Please upload a PDF file'
                });

            }


            const angle =
                parseInt(
                    req.body.degrees
                ) || 90;


            const validAngles = [
                0,
                90,
                180,
                270
            ];


            if (
                !validAngles.includes(angle)
            ) {

                await cleanupFiles(file);

                return res.status(400).json({

                    error:
                        'Invalid rotation angle. Use 0, 90, 180, or 270'

                });

            }


            const fileBuffer =
                await fs.readFile(file.path);


            const pdf =
                await PDFDocument.load(
                    fileBuffer,
                    {
                        ignoreEncryption: true,
                        updateMetadata: false
                    }
                );


            const pages =
                pdf.getPages();


            for (const page of pages) {

                page.setRotation(
                    degrees(angle)
                );

            }


            const resultBytes =
                await pdf.save({

                    useObjectStreams: false,

                    addDefaultPage: false

                });


            await cleanupFiles(file);


            res.setHeader(
                'Content-Type',
                'application/pdf'
            );


            res.setHeader(
                'Content-Disposition',
                'attachment; filename=rotated.pdf'
            );


            res.setHeader(
                'Content-Length',
                resultBytes.length
            );


            res.send(
                Buffer.from(resultBytes)
            );


            console.log(
                '✅ Rotate completed successfully\n'
            );


        } catch (error) {

            console.error(
                '❌ Rotate error:',
                error
            );


            await cleanupFiles(file);


            if (!res.headersSent) {

                res.status(500).json({
                    error: error.message
                });

            }

        }

    }
);


// ============================================================
// DELETE PAGES
// ============================================================
//
// POST /api/pdf/delete
//
// pages = [0, 2, 4]
//
// ============================================================

router.post(
    '/delete',
    upload.single('file'),
    async (req, res) => {

        const file = req.file;

        console.log(
            '\n=== DELETE REQUEST ==='
        );


        try {

            if (!file) {

                return res.status(400).json({
                    error: 'Please upload a PDF file'
                });

            }


            let pageRanges =
                req.body.pages || '[]';


            if (
                typeof pageRanges === 'string'
            ) {

                try {

                    pageRanges =
                        JSON.parse(pageRanges);

                } catch (error) {

                    pageRanges =
                        pageRanges
                            .split(',')
                            .map(Number);

                }

            }


            if (!Array.isArray(pageRanges)) {

                pageRanges = [
                    pageRanges
                ];

            }


            pageRanges =
                pageRanges
                    .map(Number)
                    .filter(
                        num =>
                            Number.isInteger(num) &&
                            num >= 0
                    );


            const fileBuffer =
                await fs.readFile(file.path);


            const pdf =
                await PDFDocument.load(
                    fileBuffer,
                    {
                        ignoreEncryption: true,
                        updateMetadata: false
                    }
                );


            const totalPages =
                pdf.getPageCount();


            // Sort descending so that removing
            // pages does not change indexes
            const sortedPages =
                pageRanges
                    .filter(
                        page =>
                            page < totalPages
                    )
                    .sort(
                        (a, b) => b - a
                    );


            for (
                const pageNum of sortedPages
            ) {

                if (
                    pageNum >= 0 &&
                    pageNum < pdf.getPageCount()
                ) {

                    pdf.removePage(
                        pageNum
                    );

                }

            }


            if (
                pdf.getPageCount() === 0
            ) {

                await cleanupFiles(file);

                return res.status(400).json({

                    error:
                        'Cannot delete all pages. At least one page must remain.'

                });

            }


            const resultBytes =
                await pdf.save({

                    useObjectStreams: false,

                    addDefaultPage: false

                });


            await cleanupFiles(file);


            res.setHeader(
                'Content-Type',
                'application/pdf'
            );


            res.setHeader(
                'Content-Disposition',
                'attachment; filename=modified.pdf'
            );


            res.setHeader(
                'Content-Length',
                resultBytes.length
            );


            res.send(
                Buffer.from(resultBytes)
            );


            console.log(
                '✅ Delete completed successfully\n'
            );


        } catch (error) {

            console.error(
                '❌ Delete error:',
                error
            );


            await cleanupFiles(file);


            if (!res.headersSent) {

                res.status(500).json({
                    error: error.message
                });

            }

        }

    }
);


// ============================================================
// ERROR HANDLER
// ============================================================

router.use(
    (err, req, res, next) => {

        console.error(
            '❌ PDF ROUTE ERROR:',
            err
        );


        if (res.headersSent) {
            return next(err);
        }


        res.status(500).json({

            error:
                err.message ||
                'PDF processing error'

        });

    }
);


// ============================================================
// EXPORT ROUTER
// ============================================================

module.exports = router;