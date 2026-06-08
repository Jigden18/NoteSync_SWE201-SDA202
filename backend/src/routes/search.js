const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
const { authenticate } = require('../middleware/auth');

const pool = new Pool({ connectionString: process.env.DIRECT_URL });

router.get('/:moduleId', authenticate, async (req, res) => {
  const { moduleId } = req.params;
  const { q } = req.query;
  if (!q) return res.status(400).json({ error: 'Query parameter q is required' });

  try {
    const result = await pool.query(
      `SELECT ln.id, ln.title, ln.lecture_date as "lectureDate", nv.version_number as "versionNumber",
        ts_headline('english', regexp_replace(nv.content,'<[^>]+>',' ','g'),
          plainto_tsquery('english', $1), 'MaxWords=20,MinWords=10') AS snippet
       FROM note_versions nv
       JOIN lecture_notes ln ON ln.current_version_id = nv.id
       WHERE to_tsvector('english', regexp_replace(nv.content,'<[^>]+>',' ','g')) @@ plainto_tsquery('english', $1) 
       AND ln.module_id = $2::uuid
       ORDER BY ln.lecture_date DESC`,
      [q, moduleId]
    );
    return res.json(result.rows);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

module.exports = router;