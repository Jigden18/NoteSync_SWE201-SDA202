const express = require('express');
const router = express.Router();
const prisma = require('../prisma');
const { authenticate } = require('../middleware/auth');

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
