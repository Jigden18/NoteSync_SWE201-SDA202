const express = require('express');
const router = express.Router();
const prisma = require('../prisma');
const { authenticate } = require('../middleware/auth');
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// POST /api/images/register
router.post('/register', authenticate, async (req, res) => {
  const { cloudinaryPublicId, publicUrl, caption, noteId, proposalId } = req.body;
  if (!cloudinaryPublicId || !publicUrl || !noteId) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const image = await prisma.noteImage.create({
      data: {
        cloudinaryPublicId,
        publicUrl,
        caption,
        noteId,
        proposalId: proposalId || null,
        uploadedBy: req.user.id,
        isOrphaned: false,
      },
    });
    return res.json(image);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// PATCH /api/images/:id/link
router.patch('/:id/link', authenticate, async (req, res) => {
  const { id } = req.params;
  const { proposalId } = req.body;
  if (!proposalId) return res.status(400).json({ error: 'proposalId is required' });

  try {
    const image = await prisma.noteImage.findUnique({ where: { id } });
    if (!image) return res.status(404).json({ error: 'Image not found' });
    if (image.uploadedBy !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const updated = await prisma.noteImage.update({
      where: { id },
      data: { proposalId },
    });
    return res.json(updated);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// DELETE /api/images/:id
router.delete('/:id', authenticate, async (req, res) => {
  const { id } = req.params;
  try {
    const image = await prisma.noteImage.findUnique({
      where: { id },
      include: { note: { include: { module: true } } },
    });
    if (!image) return res.status(404).json({ error: 'Image not found' });

    const isOwner = image.uploadedBy === req.user.id;
    const isLecturer = image.note.module.lecturerId === req.user.id;

    if (!isOwner && !isLecturer) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Destroy Cloudinary asset
    await cloudinary.uploader.destroy(image.cloudinaryPublicId);

    // Delete database record
    await prisma.noteImage.delete({ where: { id } });

    return res.json({ success: true });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

module.exports = router;
