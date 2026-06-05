const express = require('express');
const router = express.Router();
const prisma = require('../prisma');
const { authenticate } = require('../middleware/auth');

// GET /api/search/:moduleId?q=
router.get('/:moduleId', authenticate, async (req, res) => {
  const { moduleId } = req.params;
  const { q } = req.query;
  if (!q) return res.status(400).json({ error: 'Query parameter q is required' });

  try {
    const results = await prisma.$queryRaw`
      SELECT ln.id, ln.title, ln.lecture_date as "lectureDate", nv.version_number as "versionNumber",
        ts_headline('english', regexp_replace(nv.content,'<[^>]+>',' ','g'),
          plainto_tsquery('english', ${q}), 'MaxWords=20,MinWords=10') AS snippet
      FROM note_versions nv
      JOIN lecture_notes ln ON ln.current_version_id = nv.id
      WHERE nv.tsv @@ plainto_tsquery('english', ${q}) AND ln.module_id = ${moduleId}::uuid
      ORDER BY ln.lecture_date DESC
    `;
    return res.json(results);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

module.exports = router;
