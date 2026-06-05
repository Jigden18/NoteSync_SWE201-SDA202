const express = require('express');
const router = express.Router();
const prisma = require('../prisma');
const { authenticate } = require('../middleware/auth');

// GET /api/notes/:id/export
router.get('/notes/:id/export', authenticate, async (req, res) => {
  const { id } = req.params;
  try {
    const note = await prisma.lectureNote.findUnique({
      where: { id },
      include: { versions: true },
    });
    if (!note) return res.status(404).json({ error: 'Note not found' });

    const currentVersion = note.versions.find((v) => v.id === note.currentVersionId);
    const content = `<h2>${note.title}</h2>\n${currentVersion ? currentVersion.content : ''}`;
    return res.json({ title: note.title, content });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// POST /api/modules/:id/compile
router.post('/modules/:id/compile', authenticate, async (req, res) => {
  const { noteIds } = req.body;
  if (!noteIds || !Array.isArray(noteIds) || noteIds.length === 0) {
    return res.status(400).json({ error: 'noteIds array is required' });
  }

  try {
    const notes = await prisma.lectureNote.findMany({
      where: { id: { in: noteIds } },
      include: { versions: true },
      orderBy: { lectureDate: 'asc' },
    });

    let compiledContent = '';
    for (const note of notes) {
      const currentVersion = note.versions.find((v) => v.id === note.currentVersionId);
      const content = currentVersion ? currentVersion.content : '';
      const dateStr = note.lectureDate ? new Date(note.lectureDate).toLocaleDateString() : '';
      compiledContent += `<h2>${note.title} (${dateStr})</h2>\n${content}\n\n`;
    }

    return res.json({ content: compiledContent });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

module.exports = router;
