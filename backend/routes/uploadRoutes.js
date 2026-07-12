const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { auth } = require('../middleware/authMiddleware');

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Storage configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

// Staff attach equipment photos, tutorial videos, and the manufacturer's manual. The
// manual is often a Word or PowerPoint file rather than a PDF, so those are accepted too.
const allowedTypes = [
    // Images
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    // Video
    'video/mp4', 'video/webm', 'video/quicktime',
    // Documents
    'application/pdf',
    'application/msword',                                                          // .doc
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',     // .docx
    'application/vnd.ms-powerpoint',                                               // .ppt
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',   // .pptx
    'application/vnd.ms-excel',                                                    // .xls
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',           // .xlsx
    'text/plain',
];

const fileFilter = (req, file, cb) => {
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Images, videos, PDF, Word, PowerPoint, and Excel files are allowed.'), false);
    }
};

const upload = multer({ 
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 100 * 1024 * 1024 // 100MB limit
    }
});

// Upload endpoint
router.post('/', auth, upload.single('file'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }
        
        const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
        res.json({ 
            url: fileUrl,
            filename: req.file.filename,
            mimetype: req.file.mimetype,
            size: req.file.size
        });
    } catch (error) {
        res.status(500).json({ message: 'Upload failed', error: error.message });
    }
});

module.exports = router;
