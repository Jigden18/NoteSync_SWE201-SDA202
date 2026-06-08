const express = require('express');
const router = express.Router();
const prisma = require('../prisma');
const { authenticate } = require('../middleware/auth');
const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const upload = multer();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// POST /api/pdfs/upload
router.post('/upload', authenticate, upload.single('file'), async (req, res) => {
  const { noteId, moduleId, isCompilation } = req.body;
  if (!moduleId) {
    return res.status(400).json({ error: 'Missing moduleId' });
  }
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  try {
    const uploadStream = (buffer, options) => {
      return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(options, (error, result) => {
          if (error) reject(error);
          else resolve(result);
        });
        stream.end(buffer);
      });
    };

    const options = {
      resource_type: 'raw',
      folder: 'notesync_pdfs',
      format: 'pdf',
    };

    const uploadResult = await uploadStream(req.file.buffer, options);

    const exportedPdf = await prisma.exportedPdf.create({
      data: {
        noteId: noteId || null,
        moduleId,
        cloudinaryPublicId: uploadResult.public_id,
        publicUrl: uploadResult.secure_url,
        exportedBy: req.user.id,
        isCompilation: isCompilation === 'true' || isCompilation === true,
      },
    });

    return res.json(exportedPdf);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// POST /api/pdfs/save
router.post('/save', authenticate, async (req, res) => {
  const { noteId, moduleId, cloudinaryPublicId, publicUrl, isCompilation } = req.body;
  if (!moduleId || !cloudinaryPublicId || !publicUrl) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const exportedPdf = await prisma.exportedPdf.create({
      data: {
        noteId: noteId || null,
        moduleId,
        cloudinaryPublicId,
        publicUrl,
        exportedBy: req.user.id,
        isCompilation: !!isCompilation,
      },
    });
    return res.json(exportedPdf);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

module.exports = router;

