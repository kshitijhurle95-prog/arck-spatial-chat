import { Router, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { STORAGE_LIMITS } from '@nebula/shared';
import { config } from '../config';
import { authenticate, AuthenticatedRequest } from '../auth';

const router = Router();

// Ensure upload directory exists
if (!fs.existsSync(config.uploadDir)) {
  fs.mkdirSync(config.uploadDir, { recursive: true });
}

// Multer storage configuration with cryptographically secure random names
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, config.uploadDir);
  },
  filename: (_req, file, cb) => {
    const randomBytes = crypto.randomBytes(16).toString('hex');
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `nebula_${Date.now()}_${randomBytes}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: STORAGE_LIMITS.MAX_FILE_SIZE_BYTES,
  },
  fileFilter: (_req, file, cb) => {
    // Validate MIME types
    const allowed = [
      ...STORAGE_LIMITS.ALLOWED_IMAGE_MIMES,
      ...STORAGE_LIMITS.ALLOWED_MEDIA_MIMES,
      ...STORAGE_LIMITS.ALLOWED_DOC_MIMES,
    ];

    if (allowed.includes(file.mimetype) || file.mimetype.startsWith('audio/') || file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file type: ${file.mimetype}`));
    }
  },
});

// ==============================================================================
// UPLOAD SINGLE FILE
// ==============================================================================
router.post('/', authenticate, upload.single('file'), (req: AuthenticatedRequest, res: Response): void => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No file was provided in the upload request.' });
      return;
    }

    const file = req.file;
    const fileUrl = `/uploads/${file.filename}`;

    res.status(201).json({
      file: {
        filename: file.filename,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        url: fileUrl,
      },
    });
  } catch (error: any) {
    console.error('File upload error:', error);
    res.status(500).json({ error: error.message || 'File upload failed.' });
  }
});

export default router;
